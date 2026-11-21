"""Conflicts routes — list/get (Saikat BE-CRUD), resolve/reject (Preetam BE-2)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ActivityLog, Conflict
from app.schemas.schemas import ConflictResponse, ListResponse, ResolveConflictRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["conflicts"])


# ── Saikat — BE-CRUD ──────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/conflicts", response_model=ListResponse)
async def list_conflicts(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conflict)
        .where(Conflict.project_id == project_id)
        .order_by(Conflict.created_at.desc())
    )
    conflicts = result.scalars().all()
    return {"data": [ConflictResponse.model_validate(c) for c in conflicts], "total": len(conflicts)}


@router.get("/conflicts/{conflict_id}", response_model=ConflictResponse)
async def get_conflict(conflict_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conflict).where(Conflict.id == conflict_id))
    conflict = result.scalar_one_or_none()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")
    return conflict


# ── Preetam — BE-2 ────────────────────────────────────────────────────────────

@router.post("/conflicts/{conflict_id}/resolve")
async def resolve_conflict(
    conflict_id: str,
    body: ResolveConflictRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resolve a conflict — calls Execution Agent to log the resolution."""
    from app.agents.execution import apply_conflict_resolution

    try:
        await apply_conflict_resolution(
            conflict_id=conflict_id,
            resolution=body.resolution,
            approved_by=body.approved_by,
            db=db,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return {"ok": True, "conflict_id": conflict_id, "status": "resolved"}


@router.post("/conflicts/{conflict_id}/reject")
async def reject_conflict(
    conflict_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Reject a conflict — marks it as 'rejected' and logs activity."""
    result = await db.execute(select(Conflict).where(Conflict.id == conflict_id))
    conflict = result.scalar_one_or_none()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    conflict.status = "rejected"
    db.add(ActivityLog(
        project_id=conflict.project_id,
        event_type="conflict_rejected",
        description=f"Conflict rejected: {conflict.title}",
        extra_data={"conflict_id": conflict_id},
    ))
    await db.commit()

    return {"ok": True, "conflict_id": conflict_id, "status": "rejected"}
