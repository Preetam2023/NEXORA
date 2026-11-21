"""Execution Agent — applies approved changes to the database.
TODO (Preetam — AI-9): implement apply_approved_changes.
Only runs AFTER human approval. Never modifies state without explicit approval.
"""
from __future__ import annotations

from app.agents.state import WorkflowState


async def apply_approved_changes(state: WorkflowState, db) -> dict:
    """Apply all approved changes from the workflow to the database.
    TODO (Preetam — AI-9): implement this async function.

    Called after human clicks Approve in the UI.
    """
    # TODO: implement
    # For each approved change in state.approved_changes:
    #   - If type="decision": INSERT into decisions with status="approved"
    #   - If type="task": INSERT into tasks
    #   - If type="project_state": UPSERT into project_state (key-value)
    #   - If type="conflict_resolution": UPDATE conflicts SET status="resolved"
    #   - Always: INSERT into activity_logs (audit trail)
    #   - Update project.completion_percentage from task counts
    # Return: {"execution_result": {"created_tasks": n, "updated_decisions": n, ...}}
    raise NotImplementedError("Execution Agent not yet implemented — Preetam AI-9")


async def apply_conflict_resolution(conflict_id: str, resolution: str, db) -> dict:
    """Called directly from the conflict resolve API endpoint (BE-2).
    TODO (Preetam — AI-9 / BE-2): implement this async function.
    """
    # TODO: implement
    # 1. Load conflict from DB
    # 2. Update conflict: status="resolved", resolved_at=now()
    # 3. Apply the specific resolution action to project_state / decisions / tasks
    # 4. Log to activity_logs
    # Return: {"ok": True}
    raise NotImplementedError("apply_conflict_resolution not yet implemented — Preetam BE-2")
