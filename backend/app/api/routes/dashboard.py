"""Dashboard aggregation route — owned by Saikat (BE-CRUD-4). SQL only, no LLM."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.models import (
    Project, ProjectMember, Meeting, Task, Conflict, ActivityLog, User,
)
from app.schemas.schemas import DashboardStats, AttentionItem, ActivityItem, ProjectResponse

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)

    # Count active projects
    active_projects = (await db.execute(
        select(func.count()).where(Project.status == "active")
    )).scalar() or 0

    # Count analyzed meetings
    meetings_analyzed = (await db.execute(
        select(func.count()).where(Meeting.status == "analyzed")
    )).scalar() or 0

    # Count pending tasks (todo + in_progress)
    pending_tasks = (await db.execute(
        select(func.count()).where(Task.status.in_(["todo", "in_progress", "pending"]))
    )).scalar() or 0

    # Count open conflicts
    open_conflicts = (await db.execute(
        select(func.count()).where(Conflict.status == "open")
    )).scalar() or 0

    # Fetch projects list with member counts
    projects_stmt = select(Project).where(Project.status != "archived").order_by(Project.created_at.desc())
    projects_rows = (await db.execute(projects_stmt)).scalars().all()

    projects = []
    for p in projects_rows:
        member_count = (await db.execute(
            select(func.count()).where(ProjectMember.project_id == p.id)
        )).scalar() or 0
        resp = ProjectResponse.model_validate(p)
        resp.member_count = member_count
        if resp.technology_stack is None:
            resp.technology_stack = []
        projects.append(resp.model_dump())

    # Attention items — high/critical open conflicts
    attention_rows = (await db.execute(
        select(Conflict, Project.name.label("project_name"))
        .join(Project, Conflict.project_id == Project.id)
        .where(
            Conflict.status == "open",
            Conflict.severity.in_(["high", "critical"]),
        )
        .order_by(Conflict.created_at.desc())
        .limit(5)
    )).all()

    attention_items = [
        AttentionItem(
            type="conflict",
            severity=conflict.severity,
            title=conflict.title,
            project_id=conflict.project_id,
            project_name=project_name,
            entity_id=conflict.id,
        )
        for conflict, project_name in attention_rows
    ]

    # Recent activity from activity_logs (join user for actor_name)
    activity_stmt = (
        select(ActivityLog, User.name.label("actor_name"), Project.name.label("project_name"))
        .outerjoin(User, ActivityLog.actor_id == User.id)
        .outerjoin(Project, ActivityLog.project_id == Project.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
    )
    activity_rows = (await db.execute(activity_stmt)).all()

    recent_activity = [
        ActivityItem(
            id=log.id,
            project_id=log.project_id or "",
            actor_name=log.actor_name or actor_name,
            action=log.action,
            summary=log.summary,
            entity_type=log.entity_type,
            created_at=log.created_at,
        )
        for log, actor_name, _project_name in activity_rows
    ]

    return DashboardStats(
        active_projects=active_projects,
        meetings_analyzed=meetings_analyzed,
        pending_tasks=pending_tasks,
        open_conflicts=open_conflicts,
        projects=projects,
        attention_items=attention_items,
        recent_activity=recent_activity,
    )
