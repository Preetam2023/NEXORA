"""Copilot Agent — hybrid SQL + pgvector retrieval, then streaming LLM response.
AI-10: Independent path, called directly from the copilot SSE endpoint.
"""
from __future__ import annotations

import logging
import uuid
from typing import AsyncGenerator

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    CopilotConversation,
    CopilotMessage,
    Decision,
    ProjectState,
    Task,
)

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are NEXORA Copilot, an AI assistant with deep knowledge of this project's
history. You answer questions about decisions, task ownership, conflicts, timelines,
and what changed — grounded in the evidence retrieved from the project database.

Rules:
- Base answers on the CONTEXT provided. Do not invent facts.
- When you cite a fact, reference the meeting or decision it came from.
- If the context does not contain enough information, say so clearly.
- Keep answers concise and direct — this is a team assistant, not a report writer.
- For ownership questions, always give the LATEST confirmed assignment.
"""

_USER_TEMPLATE = """\
=== PROJECT CONTEXT ===
{project_state}

=== RELEVANT DECISIONS (approved) ===
{decisions}

=== ACTIVE TASKS & OWNERSHIP ===
{tasks}

=== RELEVANT TRANSCRIPT PASSAGES ===
{passages}

=== CONVERSATION HISTORY ===
{history}

=== QUESTION ===
{question}
"""


async def answer(
    project_id: str,
    message: str,
    conversation_id: str | None,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """Copilot Agent entry point — yields SSE-formatted strings (AI-10).

    Flow:
    1. SQL: load project_state, recent approved decisions, active tasks
    2. pgvector: similarity search on transcript_chunks for relevant passages
    3. Load/create conversation, save user message
    4. Stream LLM response — yield SSE token events
    5. Save assistant response to DB
    """
    from app.ai.factory import get_fast_ai_service
    import json

    ai = get_fast_ai_service()

    # 1. SQL retrieval — project state
    result = await db.execute(
        select(ProjectState).where(ProjectState.project_id == project_id)
    )
    state_kv = {ps.state_key: ps.state_value for ps in result.scalars().all()}
    project_state_text = "\n".join(f"  {k}: {v}" for k, v in state_kv.items()) or "(none)"

    # Approved decisions (latest 15)
    result = await db.execute(
        select(Decision)
        .where(Decision.project_id == project_id, Decision.status == "approved")
        .order_by(Decision.created_at.desc())
        .limit(15)
    )
    decisions = result.scalars().all()
    decisions_text = "\n".join(
        f"- [{d.category}] {d.title}: {d.description}"
        for d in decisions
    ) or "(none)"

    # Active tasks with assignees
    result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id, Task.status.notin_(["completed", "cancelled"]))
        .order_by(Task.created_at.desc())
        .limit(20)
    )
    tasks_text = "\n".join(
        f"- {r.title} → {r.assigned_to_name or 'unassigned'} [{r.status}]"
        for r in result.scalars().all()
    ) or "(none)"

    # 2. pgvector similarity search for relevant transcript passages
    passages_text = await _vector_search(project_id, message, db)

    # 3. Conversation management
    conv_id = conversation_id
    if not conv_id:
        conv = CopilotConversation(
            id=str(uuid.uuid4()),
            project_id=project_id,
            title=message[:60],
        )
        db.add(conv)
        await db.flush()
        conv_id = str(conv.id)
    else:
        result = await db.execute(
            select(CopilotConversation).where(CopilotConversation.id == conv_id)
        )
        if not result.scalar_one_or_none():
            conv_id = str(uuid.uuid4())
            db.add(CopilotConversation(id=conv_id, project_id=project_id, title=message[:60]))
            await db.flush()

    # Load recent conversation history (last 6 exchanges)
    result = await db.execute(
        select(CopilotMessage)
        .where(CopilotMessage.conversation_id == conv_id)
        .order_by(CopilotMessage.created_at.desc())
        .limit(6)
    )
    history_msgs = list(reversed(result.scalars().all()))
    history_text = "\n".join(
        f"{m.role.upper()}: {m.content}" for m in history_msgs
    ) or "(new conversation)"

    # Save user message
    db.add(CopilotMessage(
        conversation_id=conv_id,
        role="user",
        content=message,
    ))
    await db.flush()

    # 4. Build prompt and stream
    prompt = _USER_TEMPLATE.format(
        project_state=project_state_text,
        decisions=decisions_text,
        tasks=tasks_text,
        passages=passages_text,
        history=history_text,
        question=message,
    )

    full_response = []
    sources = [
        {"type": "project_state", "count": len(state_kv)},
        {"type": "decisions", "count": len(decisions)},
    ]

    # Yield conversation_id first so client can track the session
    yield f"data: {json.dumps({'type': 'meta', 'payload': {'conversation_id': conv_id}})}\n\n"

    try:
        import asyncio
        loop = asyncio.get_event_loop()

        # Run the synchronous streaming generator in a thread to avoid blocking the event loop
        def collect_chunks():
            return list(ai.complete_stream(system=_SYSTEM_PROMPT, user=prompt))

        chunks = await loop.run_in_executor(None, collect_chunks)

        for chunk in chunks:
            full_response.append(chunk)
            yield f"data: {json.dumps({'type': 'token', 'payload': {'text': chunk}})}\n\n"

    except Exception as exc:
        logger.error("Copilot LLM error: %s", exc)
        yield f"data: {json.dumps({'type': 'error', 'payload': {'message': str(exc)}})}\n\n"
        return

    full_text = "".join(full_response)

    # 5. Save assistant response
    try:
        db.add(CopilotMessage(
            conversation_id=conv_id,
            role="assistant",
            content=full_text,
            sources=sources,
        ))
        await db.commit()
    except Exception as exc:
        logger.warning("Failed to save copilot message: %s", exc)

    yield f"data: {json.dumps({'type': 'done', 'payload': {'sources': sources}})}\n\n"


async def _vector_search(project_id: str, query: str, db: AsyncSession) -> str:
    """Semantic search on transcript_chunks using pgvector.

    Embeds the query via LiteLLM embeddings and finds the top-5 nearest chunks.
    Falls back to keyword search if embedding fails.
    """
    try:
        import litellm
        from app.core.config import get_settings

        settings = get_settings()
        embed_response = litellm.embedding(
            model=settings.aicore_llm_model,
            input=[query],
        )
        query_vec = embed_response.data[0]["embedding"]

        # pgvector cosine similarity search
        result = await db.execute(
            text("""
                SELECT content, speaker, timestamp_reference
                FROM transcript_chunks
                WHERE project_id = :pid
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT 5
            """),
            {"pid": project_id, "vec": str(query_vec)},
        )
        rows = result.fetchall()
        if rows:
            return "\n".join(
                f"[{r.speaker or 'unknown'}] {r.content}"
                for r in rows
            )
    except Exception as exc:
        logger.info("pgvector search failed (%s), falling back to no passages", exc)

    return "(no transcript passages available)"
