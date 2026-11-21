"""Memory Agent — retrieves historical project context from the database.
TODO (Preetam — AI-4): implement retrieve_historical_context node.
Pure SQL retrieval — no LLM calls in this node.
"""
from __future__ import annotations

from app.agents.state import WorkflowState, HistoricalContext


async def retrieve_historical_context(state: WorkflowState, db) -> dict:
    """LangGraph node — fetch historical decisions, tasks, assignments, project state.
    TODO (Preetam — AI-4): implement this async function.
    """
    # TODO: implement
    # Query these tables for state.project_id:
    # 1. decisions WHERE status='approved' ORDER BY created_at — historical approved decisions
    # 2. tasks WHERE status NOT IN ('completed','cancelled') — active task ownership
    # 3. project_state — current approved state key-value pairs (e.g. database_technology=mongodb)
    # 4. project.requirements, project.technology_stack — for recommendation context
    # Return: {"historical_context": HistoricalContext(...)}
    raise NotImplementedError("Memory Agent not yet implemented — Preetam AI-4")
