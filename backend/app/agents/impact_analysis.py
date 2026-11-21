"""Impact Analysis — finds affected tasks and members for each detected conflict.
AI-7: Pure SQL, no LLM. Runs after Conflict Analyst.
"""
from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import WorkflowState
from app.models.models import ProjectMember, Task, User

logger = logging.getLogger(__name__)


async def run_impact_analysis(state: WorkflowState, db: AsyncSession) -> dict:
    """LangGraph node — for each conflict find affected tasks and members (AI-7).

    Pure SQL: looks up which active tasks and assignments overlap with the
    entities mentioned in each conflict (by name/key matching).
    No LLM call needed — impact is deterministic from DB state.
    """
    if not state.conflicts:
        return {"impact_reports": []}

    pid = state.project_id

    # Load active tasks once
    result = await db.execute(
        select(Task)
        .where(Task.project_id == pid, Task.status.notin_(["completed", "cancelled"]))
    )
    active_tasks = [
        {
            "id": str(r.id),
            "title": r.title,
            "assigned_to_name": r.assigned_to_name,
            "status": r.status,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "priority": r.priority,
        }
        for r in result.scalars().all()
    ]

    # Load all project members
    result = await db.execute(
        select(ProjectMember, User.name.label("user_name"))
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == pid)
    )
    members = {r.user_name: r.ProjectMember.role for r in result.all()}

    impact_reports = []
    for conflict in state.conflicts:
        # Identify names mentioned in conflict states
        mentioned_names: set[str] = set()
        for val in list(conflict.previous_state.values()) + list(conflict.new_state.values()):
            if isinstance(val, str):
                for name in members:
                    if name.lower() in val.lower():
                        mentioned_names.add(name)

        # Identify key terms for task matching
        conflict_terms = (
            conflict.title.lower().split()
            + list(conflict.previous_state.keys())
            + list(conflict.new_state.keys())
        )

        # Tasks affected: assigned to a mentioned person OR title overlaps conflict terms
        affected_tasks = []
        for task in active_tasks:
            owner_hit = task["assigned_to_name"] in mentioned_names
            title_hit = any(term in task["title"].lower() for term in conflict_terms if len(term) > 3)
            if owner_hit or title_hit:
                affected_tasks.append({**task, "reason": "owner_change" if owner_hit else "scope_overlap"})

        # Deadline risk: any affected task has a due_date within 7 days of "now" (approximated)
        deadline_risk = any(t["due_date"] is not None for t in affected_tasks)

        impact_reports.append({
            "conflict_title": conflict.title,
            "conflict_category": conflict.category,
            "severity": conflict.severity,
            "affected_tasks": affected_tasks,
            "affected_members": list(mentioned_names),
            "deadline_risk": deadline_risk,
            "task_count": len(affected_tasks),
            "member_count": len(mentioned_names),
        })

    logger.info(
        "Impact Analysis done: %d conflicts processed, %d total affected tasks",
        len(impact_reports),
        sum(r["task_count"] for r in impact_reports),
    )
    return {"impact_reports": impact_reports}
