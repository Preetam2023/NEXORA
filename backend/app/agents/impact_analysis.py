"""Impact Analysis Agent — finds affected tasks/members/deadlines for a proposed change.
TODO (Preetam — AI-7): implement run_impact_analysis node.
Mostly SQL-based with optional LLM explanation — no extra LLM call needed.
"""
from __future__ import annotations

from app.agents.state import WorkflowState


async def run_impact_analysis(state: WorkflowState, db) -> dict:
    """LangGraph node — identify what's affected by each detected conflict.
    TODO (Preetam — AI-7): implement this async function.
    """
    # TODO: implement
    # For each conflict in state.conflicts:
    #   1. Query tasks related to the conflict subject (by keyword match in title/description)
    #   2. Find members assigned to those tasks
    #   3. Find deadlines that could be affected
    #   4. Build impact_report: { affected_tasks: [], affected_members: [], deadline_risk: bool }
    # Return: {"impact_reports": [...]}
    raise NotImplementedError("Impact Analysis not yet implemented — Preetam AI-7")
