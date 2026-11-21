"""Tasks CRUD routes — owned by Saikat (BE-CRUD-3)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import (
    CreateTaskRequest, UpdateTaskRequest, TaskResponse, ListResponse,
)

router = APIRouter(prefix="/api", tags=["tasks"])


# ── TODO (Saikat — BE-CRUD-3): implement list_tasks ──────────────────────────
@router.get("/projects/{project_id}/tasks", response_model=ListResponse)
async def list_tasks(project_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: query tasks for project, join assignee user for assigned_name
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-3): implement create_task ─────────────────────────
@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(project_id: str, body: CreateTaskRequest, db: AsyncSession = Depends(get_db)):
    # TODO: create Task record, commit, return
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-3): implement update_task ─────────────────────────
@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, body: UpdateTaskRequest, db: AsyncSession = Depends(get_db)):
    # TODO: partial update task, commit, return
    # When status → "completed", recalculate project.completion_percentage
    raise HTTPException(status_code=501, detail="Not implemented yet")
