"""Conflicts routes — list/get (Saikat BE-CRUD), resolve/reject (Preetam BE-2)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import ConflictResponse, ResolveConflictRequest, ListResponse

router = APIRouter(prefix="/api", tags=["conflicts"])


# ── TODO (Saikat — BE-CRUD): implement list_conflicts ────────────────────────
@router.get("/projects/{project_id}/conflicts", response_model=ListResponse)
async def list_conflicts(project_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: query conflicts for project ordered by created_at desc
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD): implement get_conflict ──────────────────────────
@router.get("/conflicts/{conflict_id}", response_model=ConflictResponse)
async def get_conflict(conflict_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch conflict by id, 404 if not found
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Preetam — BE-2): implement resolve_conflict ────────────────────────
@router.post("/conflicts/{conflict_id}/resolve")
async def resolve_conflict(conflict_id: str, body: ResolveConflictRequest, db: AsyncSession = Depends(get_db)):
    # TODO: update conflict status="resolved", trigger Execution Agent to apply changes
    # Preetam implements — calls execution.apply_resolution(conflict_id, body.resolution, db)
    raise HTTPException(status_code=501, detail="Not implemented yet — Preetam's task BE-2")


# ── TODO (Preetam — BE-2): implement reject_conflict ─────────────────────────
@router.post("/conflicts/{conflict_id}/reject")
async def reject_conflict(conflict_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: update conflict status="rejected", log activity
    # Preetam implements
    raise HTTPException(status_code=501, detail="Not implemented yet — Preetam's task BE-2")
