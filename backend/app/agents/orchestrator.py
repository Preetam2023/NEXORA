"""LangGraph Orchestrator — wires all agent nodes into the analysis workflow.
AI-8: StateGraph with parallel Meeting Analyst + Memory Agent, then sequential pipeline.
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import HistoricalContext, WorkflowState
from app.models.models import Meeting, Project

logger = logging.getLogger(__name__)


async def run_workflow(meeting_id: str, db: AsyncSession) -> WorkflowState:
    """Run the full meeting analysis workflow (AI-8).

    Graph:
        [load data]
            │
        ┌───┴───────────────────────┐  asyncio.gather — parallel
        │ Meeting Analyst (LLM)     │  │ Memory Agent (SQL)
        └───┬───────────────────────┘  │
            │◄──────────────────────────┘
            ▼
        Conflict Analyst (LLM — history injected)
            │
            ▼
        Impact Analysis (SQL)
            │
            ▼
        [persist proposed state to DB — status="proposed"]
            │
            ▼
        return WorkflowState  ← SSE streams to UI; waits for human approval
    """
    from app.agents.conflict_analyst import run_conflict_analyst
    from app.agents.execution import apply_approved_changes
    from app.agents.impact_analysis import run_impact_analysis
    from app.agents.meeting_analyst import run_meeting_analyst
    from app.agents.memory_agent import retrieve_historical_context

    # ── 1. Load meeting + project from DB ──────────────────────────────────────
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise ValueError(f"Meeting {meeting_id} not found")

    result = await db.execute(select(Project).where(Project.id == meeting.project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise ValueError(f"Project {meeting.project_id} not found")

    state = WorkflowState(
        workflow_id=str(uuid.uuid4()),
        project_id=str(meeting.project_id),
        meeting_id=str(meeting.id),
        transcript=meeting.transcript or "",
        meeting_metadata={
            "title": meeting.title,
            "meeting_type": meeting.meeting_type,
            "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else "",
            "participants": meeting.participants or [],
        },
        project_context={
            "name": project.name,
            "description": project.description or "",
            "tech_stack": ", ".join(project.technology_stack or [])
            if isinstance(project.technology_stack, list)
            else str(project.technology_stack or ""),
            "requirements": project.requirements or "",
        },
    )

    logger.info("Orchestrator: starting workflow %s for meeting %s", state.workflow_id, meeting_id)

    # ── 2. PARALLEL: Meeting Analyst (LLM) + Memory Agent (SQL) ───────────────
    analyst_future = asyncio.get_event_loop().run_in_executor(
        None, run_meeting_analyst, state
    )
    memory_future = retrieve_historical_context(state, db)

    analyst_result, memory_result = await asyncio.gather(analyst_future, memory_future)

    state = state.model_copy(update={**analyst_result, **memory_result})
    logger.info(
        "Parallel step done: analysis=%s, context=%s",
        bool(state.meeting_analysis),
        bool(state.historical_context),
    )

    # ── 3. Conflict Analyst (LLM — needs both results) ────────────────────────
    conflict_result = await asyncio.get_event_loop().run_in_executor(
        None, run_conflict_analyst, state
    )
    state = state.model_copy(update=conflict_result)
    logger.info("Conflict Analyst: %d conflicts", len(state.conflicts))

    # ── 4. Impact Analysis (SQL) ──────────────────────────────────────────────
    impact_result = await run_impact_analysis(state, db)
    state = state.model_copy(update=impact_result)

    # ── 5. Embed transcript chunks for pgvector search (BE-4) ─────────────────
    from app.agents.embeddings import embed_meeting_transcript
    await embed_meeting_transcript(meeting_id, db)

    # ── 6. Persist proposed data to DB (status="proposed") ───────────────────
    await _persist_proposed(state, db)

    # Update meeting processing status
    meeting.processing_status = "analysis_complete"
    if state.meeting_analysis:
        meeting.summary = state.meeting_analysis.summary
        meeting.participants = state.meeting_analysis.participants
        meeting.analysis_result = {
            "workflow_id": state.workflow_id,
            "decisions": len(state.meeting_analysis.decisions),
            "tasks": len(state.meeting_analysis.tasks),
            "conflicts": len(state.conflicts),
        }
    await db.commit()

    logger.info(
        "Orchestrator done: workflow=%s, %d decisions, %d tasks, %d conflicts",
        state.workflow_id,
        len(state.meeting_analysis.decisions) if state.meeting_analysis else 0,
        len(state.meeting_analysis.tasks) if state.meeting_analysis else 0,
        len(state.conflicts),
    )
    return state


async def _persist_proposed(state: WorkflowState, db: AsyncSession) -> None:
    """Write decisions, tasks, and conflicts to DB with status='proposed'.

    These are NOT approved yet — the UI shows them for human review.
    Execution Agent writes the approved versions after the user clicks Approve.
    """
    from app.models.models import Conflict, Decision, Task, User
    import uuid as _uuid

    if not state.meeting_analysis:
        return

    name_cache: dict[str, str | None] = {}

    async def _resolve_name(name: str | None) -> str | None:
        if not name:
            return None
        if name in name_cache:
            return name_cache[name]
        result = await db.execute(select(User).where(User.name == name))
        user = result.scalar_one_or_none()
        name_cache[name] = str(user.id) if user else None
        return name_cache[name]

    # Proposed decisions
    for d in state.meeting_analysis.decisions:
        db.add(Decision(
            id=str(_uuid.uuid4()),
            project_id=state.project_id,
            meeting_id=state.meeting_id,
            title=d.title,
            description=d.description,
            category=d.category,
            status="proposed",
            evidence=[ev.model_dump() for ev in d.evidence],
            confidence=d.confidence,
        ))

    # Proposed tasks
    from datetime import date as _date
    for t in state.meeting_analysis.tasks:
        assignee_id = await _resolve_name(t.assigned_to_name)
        due = None
        if t.due_date:
            try:
                due = _date.fromisoformat(t.due_date)
            except ValueError:
                pass
        db.add(Task(
            id=str(_uuid.uuid4()),
            project_id=state.project_id,
            title=t.title,
            description=t.description,
            assigned_to=assignee_id,
            priority=t.priority,
            status="proposed",
            due_date=due,
            source_meeting_id=state.meeting_id,
            source_evidence=[ev.model_dump() for ev in t.evidence],
        ))

    # Conflicts
    for i, c in enumerate(state.conflicts):
        impact = state.impact_reports[i] if i < len(state.impact_reports) else {}
        db.add(Conflict(
            id=str(_uuid.uuid4()),
            project_id=state.project_id,
            category=c.category,
            title=c.title,
            previous_state=c.previous_state,
            new_state=c.new_state,
            evidence=[ev.model_dump() for ev in c.evidence],
            severity=c.severity,
            confidence=c.confidence,
            ai_explanation=c.ai_explanation,
            recommendation=c.recommendation.model_dump() if c.recommendation else None,
            status="open",
            impact_analysis=impact,
        ))

    await db.flush()
