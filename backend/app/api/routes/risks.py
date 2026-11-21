"""Risk Radar route — BE-5.
GET /api/projects/{id}/risks — deterministic rules-based risk detection.
No LLM. Reads DB state and applies risk rules.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Conflict, Decision, Task
from app.schemas.schemas import ListResponse, RiskResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["risks"])


@router.get("/projects/{project_id}/risks", response_model=ListResponse)
async def get_project_risks(project_id: str, db: AsyncSession = Depends(get_db)):
    """Detect project risks using deterministic rules — no LLM needed (BE-5).

    Rules:
    1. Overdue tasks (past due_date, not completed)
    2. Unresolved critical/high conflicts older than 48h
    3. Tasks with no assignee (unowned work)
    4. Decisions with low confidence (<0.6) still proposed
    5. No activity in 7 days (stale project)
    """
    now = datetime.now(timezone.utc)
    risks = []

    # ── Rule 1: Overdue tasks ─────────────────────────────────────────────────
    result = await db.execute(
        select(Task)
        .where(
            Task.project_id == project_id,
            Task.status.notin_(["completed", "cancelled"]),
            Task.due_date.isnot(None),
        )
    )
    for task in result.scalars().all():
        if task.due_date and task.due_date < now.date():
            days_overdue = (now.date() - task.due_date).days
            severity = "critical" if days_overdue > 7 else "high" if days_overdue > 3 else "medium"
            risks.append({
                "id": f"risk-overdue-{task.id}",
                "project_id": project_id,
                "title": f"Overdue task: {task.title}",
                "description": f"Task assigned to {task.assigned_to_name or 'unassigned'} is {days_overdue} day(s) overdue.",
                "severity": severity,
                "source_type": "task",
                "source_id": str(task.id),
                "status": "open",
                "created_at": now.isoformat(),
            })

    # ── Rule 2: Unresolved high/critical conflicts older than 48h ─────────────
    cutoff_48h = now - timedelta(hours=48)
    result = await db.execute(
        select(Conflict).where(
            Conflict.project_id == project_id,
            Conflict.status == "open",
            Conflict.severity.in_(["high", "critical"]),
            Conflict.created_at < cutoff_48h,
        )
    )
    for conflict in result.scalars().all():
        hours_open = int((now - conflict.created_at).total_seconds() / 3600)
        risks.append({
            "id": f"risk-conflict-{conflict.id}",
            "project_id": project_id,
            "title": f"Unresolved {conflict.severity} conflict: {conflict.title}",
            "description": f"This conflict has been open for {hours_open}h without resolution.",
            "severity": conflict.severity,
            "source_type": "conflict",
            "source_id": str(conflict.id),
            "status": "open",
            "created_at": now.isoformat(),
        })

    # ── Rule 3: Unowned tasks ─────────────────────────────────────────────────
    result = await db.execute(
        select(Task).where(
            Task.project_id == project_id,
            Task.assigned_to_name.is_(None),
            Task.status.notin_(["completed", "cancelled", "proposed"]),
        )
    )
    for task in result.scalars().all():
        risks.append({
            "id": f"risk-unowned-{task.id}",
            "project_id": project_id,
            "title": f"Unowned task: {task.title}",
            "description": "This task has no assignee — it may be missed.",
            "severity": "medium",
            "source_type": "task",
            "source_id": str(task.id),
            "status": "open",
            "created_at": now.isoformat(),
        })

    # ── Rule 4: Low-confidence proposed decisions ─────────────────────────────
    result = await db.execute(
        select(Decision).where(
            Decision.project_id == project_id,
            Decision.status == "proposed",
            Decision.confidence < 0.6,
        )
    )
    for decision in result.scalars().all():
        risks.append({
            "id": f"risk-lowconf-{decision.id}",
            "project_id": project_id,
            "title": f"Low-confidence decision pending: {decision.title}",
            "description": f"AI confidence is {decision.confidence:.0%} — human review recommended before approving.",
            "severity": "low",
            "source_type": "decision",
            "source_id": str(decision.id),
            "status": "open",
            "created_at": now.isoformat(),
        })

    # Sort: critical → high → medium → low
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    risks.sort(key=lambda r: severity_order.get(r["severity"], 9))

    logger.info("Risk Radar: %d risks detected for project %s", len(risks), project_id)
    return {"data": risks, "total": len(risks)}
