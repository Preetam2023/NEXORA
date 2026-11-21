"""Memory Agent — retrieves historical project context. Pure SQL, no LLM."""
from __future__ import annotations

import logging

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import HistoricalContext, WorkflowState
from app.models.models import Decision, Project, ProjectMember, ProjectState, Task, User

logger = logging.getLogger(__name__)


async def retrieve_historical_context(state: WorkflowState, db: AsyncSession) -> dict:
    """LangGraph node — fetch all historical context needed by Conflict Analyst (AI-4).

    Returns approved decisions, active tasks with owners, current project_state KV pairs,
    and project requirements / tech stack. No LLM call — pure SQL reads.
    """
    pid = state.project_id

    # 1. Approved decisions — full history (title, description, category, evidence)
    result = await db.execute(
        select(Decision)
        .where(Decision.project_id == pid, Decision.status == "approved")
        .order_by(Decision.created_at)
    )
    approved_decisions = [
        {
            "id": str(d.id),
            "title": d.title,
            "description": d.description,
            "category": d.category,
            "evidence": d.evidence or [],
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in result.scalars().all()
    ]

    # 2. Active tasks with assigned member names
    result = await db.execute(
        select(Task)
        .where(
            Task.project_id == pid,
            Task.status.notin_(["completed", "cancelled"]),
        )
        .order_by(Task.created_at)
    )
    current_assignments = [
        {
            "id": str(r.id),
            "title": r.title,
            "assigned_to_name": r.assigned_to_name,
            "priority": r.priority,
            "status": r.status,
            "due_date": r.due_date.isoformat() if r.due_date else None,
        }
        for r in result.scalars().all()
    ]

    # 3. project_state key-value store — the living project truth
    result = await db.execute(
        select(ProjectState).where(ProjectState.project_id == pid)
    )
    project_state: dict = {
        ps.state_key: ps.state_value
        for ps in result.scalars().all()
    }

    # 4. Project requirements and tech stack for recommendation context
    result = await db.execute(select(Project).where(Project.id == pid))
    project = result.scalar_one_or_none()
    requirements = project.requirements or "" if project else ""
    tech_stack = project.technology_stack or [] if project else []

    # 5. Team members and their roles
    result = await db.execute(
        select(ProjectMember, User.name.label("user_name"))
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == pid)
    )
    team = [
        f"{r.user_name} ({r.ProjectMember.project_role})"
        for r in result.all()
    ]
    project_requirements = (
        f"Requirements: {requirements}\n"
        f"Tech stack: {', '.join(tech_stack) if isinstance(tech_stack, list) else tech_stack}\n"
        f"Team: {', '.join(team)}"
    )

    historical_context = HistoricalContext(
        previous_decisions=approved_decisions,
        current_assignments=current_assignments,
        existing_tasks=[],  # full task list already in current_assignments
        project_state=project_state,
        project_requirements=project_requirements,
    )

    logger.info(
        "Memory Agent: %d approved decisions, %d active tasks, %d state keys",
        len(approved_decisions), len(current_assignments), len(project_state),
    )
    return {"historical_context": historical_context}
