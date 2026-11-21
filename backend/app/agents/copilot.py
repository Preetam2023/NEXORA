"""Copilot Agent — hybrid retrieval (SQL + semantic) + SSE streaming response.
TODO (Preetam — AI-10): implement answer() generator.
"""
from __future__ import annotations

from typing import AsyncGenerator

SYSTEM_PROMPT = """\
You are NEXORA's Project AI Copilot. Answer questions about projects using ONLY
the provided context — structured data and meeting evidence.

RULES:
- Use ONLY facts from the provided context. Never invent.
- If information is unavailable, say "I don't have that information in the project records."
- Cite your sources: mention the meeting name and speaker for important facts.
- For current state questions (who owns X, what's the status): use the structured data.
- For historical questions (why was X decided): use the meeting evidence.
- Format lists with bullet points. Keep answers concise but complete.
"""


async def answer(project_id: str | None, message: str, conversation_id: str | None, db) -> AsyncGenerator[str, None]:
    """Generator that yields SSE event strings for the copilot response.
    TODO (Preetam — AI-10): implement this async generator.

    Yields strings in SSE format:
      data: {"type": "token", "payload": {"text": "Based on"}}\n\n
      data: {"type": "done",  "payload": {"sources": [...]}}\n\n
    """
    # TODO: implement
    # 1. Classify query type: current_state | historical | task_lookup | risk_query
    # 2. For current_state: SQL query tasks/decisions/project_state
    # 3. For historical: vector search transcript_chunks (pgvector similarity)
    # 4. Build context string from retrieved data
    # 5. Call ai.complete_stream(system=SYSTEM_PROMPT, user=context+question)
    # 6. For each token chunk: yield f'data: {{"type":"token","payload":{{"text":"{chunk}"}}}}\n\n'
    # 7. Collect sources from retrieved evidence
    # 8. Final: yield f'data: {{"type":"done","payload":{{"sources":[...]}}}}\n\n'
    raise NotImplementedError("Copilot Agent not yet implemented — Preetam AI-10")
    yield  # make this a generator
