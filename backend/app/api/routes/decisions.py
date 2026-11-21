"""Decisions read routes — owned by Saikat (BE-CRUD-5)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import DecisionResponse, ListResponse

router = APIRouter(prefix="/api", tags=["decisions"])


# ── TODO (Saikat — BE-CRUD-5): implement list_decisions ──────────────────────
@router.get("/projects/{project_id}/decisions", response_model=ListResponse)
async def list_decisions(project_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: query decisions for project ordered by created_at desc
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-5): implement get_decision ────────────────────────
@router.get("/decisions/{decision_id}", response_model=DecisionResponse)
async def get_decision(decision_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch decision by id, 404 if not found
    raise HTTPException(status_code=501, detail="Not implemented yet")
