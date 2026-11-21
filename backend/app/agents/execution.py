"""Execution Agent — writes approved changes to DB after human approval.
AI-9: Only called after approval_status == "approved".
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.agents.state import WorkflowState
from app.models.models import (
    ActivityLog,
    Conflict,
    Decision,
    DecisionVersion,
    ProjectState,
    Task,
    User,
)

logger = logging.getLogger(__name__)


async def apply_approved_changes(state: WorkflowState, db: AsyncSession) -> dict:
    """LangGraph node — persist approved analysis results to DB (AI-9).

    Called ONLY when state.approval_status == "approved".
    Writes: decisions (status=approved), tasks, project_state KV, activity_logs.
    Never deletes historical records — all prior data is immutable.
    """
    if state.approval_status != "approved":
        logger.info("Execution Agent: not approved (%s) — skipping", state.approval_status)
        return {"execution_result": {"skipped": True, "reason": state.approval_status}}

    if not state.meeting_analysis:
        return {"execution_result": {"skipped": True, "reason": "no_analysis"}}

    analysis = state.meeting_analysis
    written_decisions = []
    written_tasks = []
    written_state_keys = []

    # 1. Write decisions
    for d in analysis.decisions:
        decision = Decision(
            id=str(uuid.uuid4()),
            project_id=state.project_id,
            meeting_id=state.meeting_id,
            title=d.title,
            description=d.description,
            category=d.category,
            status="approved",
            evidence=[ev.model_dump() for ev in d.evidence],
            confidence=d.confidence,
        )
        db.add(decision)
        written_decisions.append(decision.id)

        # Log activity
        db.add(ActivityLog(
            project_id=state.project_id,
            action="decision_approved",
            summary=f"Decision approved: {d.title}",
            extra_data={"decision_id": decision.id, "meeting_id": state.meeting_id},
        ))

    # 2. Write tasks — resolve assigned_to UUID by name lookup
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

    for t in analysis.tasks:
        assignee_id = await _resolve_name(t.assigned_to_name)
        from datetime import date
        due_date = None
        if t.due_date:
            try:
                due_date = date.fromisoformat(t.due_date)
            except ValueError:
                pass

        task = Task(
            id=str(uuid.uuid4()),
            project_id=state.project_id,
            title=t.title,
            assigned_to_name=t.assigned_to_name,
            priority=t.priority,
            status="todo",
            due_date=due_date,
            meeting_id=state.meeting_id,
            evidence=[ev.model_dump() for ev in t.evidence],
        )
        db.add(task)
        written_tasks.append(task.id)

        db.add(ActivityLog(
            project_id=state.project_id,
            action="task_created",
            summary=f"Task created: {t.title}",
            extra_data={
                "task_id": task.id,
                "assigned_to_name": t.assigned_to_name,
                "meeting_id": state.meeting_id,
            },
        ))

    # 3. Update project_state from approved changes
    for change in state.approved_changes:
        key = change.get("key")
        value = change.get("value")
        if not key:
            continue

        result = await db.execute(
            select(ProjectState).where(
                ProjectState.project_id == state.project_id,
                ProjectState.state_key == key,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.state_value = value
        else:
            db.add(ProjectState(
                project_id=state.project_id,
                state_key=key,
                state_value=value,
            ))
        written_state_keys.append(key)

    await db.commit()

    result_summary = {
        "decisions_written": len(written_decisions),
        "tasks_written": len(written_tasks),
        "state_keys_updated": written_state_keys,
        "meeting_id": state.meeting_id,
    }
    logger.info("Execution Agent done: %s", result_summary)
    return {"execution_result": result_summary}


async def apply_conflict_resolution(
    conflict_id: str,
    resolution: str,
    approved_by: str,
    db: AsyncSession,
) -> None:
    """Called from the conflict resolve API endpoint (not a LangGraph node).

    Resolves a conflict and updates linked decisions:
    - Decisions from the conflicting (old) meeting → "superseded"
    - Decisions from the new meeting (the one that introduced the conflict) → "approved"
    Also writes the resolved state to ProjectState if the conflict has new_state data.
    """
    result = await db.execute(select(Conflict).where(Conflict.id == conflict_id))
    conflict = result.scalar_one_or_none()
    if not conflict:
        raise ValueError(f"Conflict {conflict_id} not found")

    from datetime import datetime, timezone
    conflict.status = "resolved"
    conflict.resolved_at = datetime.now(timezone.utc)

    # Approve decisions from the meeting that introduced the conflict (new_state wins)
    # and supersede older proposed decisions in the same category for this project.
    if conflict.meeting_id:
        # Approve all proposed decisions from the winning (new) meeting
        new_dec_result = await db.execute(
            select(Decision).where(
                Decision.project_id == conflict.project_id,
                Decision.meeting_id == conflict.meeting_id,
                Decision.status == "proposed",
            )
        )
        for d in new_dec_result.scalars().all():
            d.status = "approved"

        # Supersede older proposed decisions in the same category (from prior meetings)
        if conflict.category:
            old_dec_result = await db.execute(
                select(Decision).where(
                    Decision.project_id == conflict.project_id,
                    Decision.category == conflict.category,
                    Decision.status == "proposed",
                    Decision.meeting_id != conflict.meeting_id,
                )
            )
            for d in old_dec_result.scalars().all():
                d.status = "superseded"

    # Write resolved new_state to ProjectState so Copilot sees the latest truth
    if conflict.new_state and conflict.category:
        # new_state is JSONB (dict) — extract a string value to store in Text state_value
        new_state_dict = conflict.new_state if isinstance(conflict.new_state, dict) else {}
        # Use the first value in new_state dict, or serialize to a readable string
        import json as _json
        if new_state_dict:
            first_val = next(iter(new_state_dict.values()), None)
            state_str = str(first_val) if first_val else _json.dumps(new_state_dict)
        else:
            state_str = _json.dumps(conflict.new_state)

        result2 = await db.execute(
            select(ProjectState).where(
                ProjectState.project_id == conflict.project_id,
                ProjectState.state_key == conflict.category,
            )
        )
        existing = result2.scalar_one_or_none()
        if existing:
            existing.state_value = state_str
        else:
            db.add(ProjectState(
                project_id=conflict.project_id,
                state_key=conflict.category,
                state_value=state_str,
            ))

    db.add(ActivityLog(
        project_id=conflict.project_id,
        action="conflict_resolved",
        summary=f"Conflict resolved: {conflict.title}",
        extra_data={
            "conflict_id": conflict_id,
            "resolution": resolution,
            "approved_by": approved_by,
            "new_state": conflict.new_state,
        },
    ))
    await db.commit()
