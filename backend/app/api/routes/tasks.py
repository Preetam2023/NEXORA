"""Tasks CRUD routes — owned by Saikat (BE-CRUD-3)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Task, ProjectMember, Project, User
from app.schemas.schemas import (
    CreateTaskRequest, UpdateTaskRequest, TaskResponse, ListResponse,
)

router = APIRouter(prefix="/api", tags=["tasks"])


def _task_to_response(task: Task) -> dict:
    return {
        "id": task.id,
        "project_id": task.project_id,
        "meeting_id": task.meeting_id,
        "title": task.title,
        "description": task.description,
        "assigned_to_name": task.assigned_to_name,
        "assigned_to": str(task.assigned_to_id) if task.assigned_to_id else None,
        "priority": task.priority,
        "status": task.status,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }


async def _recalculate_completion(db: AsyncSession, project_id: str) -> None:
    total = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.project_id == project_id,
            Task.status.not_in(["cancelled"]),
        )
    )).scalar() or 0
    done = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.project_id == project_id,
            Task.status == "completed",
        )
    )).scalar() or 0

    pct = round((done / total) * 100) if total > 0 else 0
    project = await db.get(Project, project_id)
    if project:
        project.completion_percentage = pct


@router.get("/projects/{project_id}/tasks", response_model=ListResponse)
async def list_tasks(project_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Task)
        .where(Task.project_id == project_id)
        .order_by(Task.created_at.desc())
    )
    tasks = (await db.execute(stmt)).scalars().all()
    return {"data": [_task_to_response(t) for t in tasks], "total": len(tasks)}


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(project_id: str, body: CreateTaskRequest, db: AsyncSession = Depends(get_db)):
    # Resolve project_member id if only name provided
    assigned_to_id = body.assigned_to_id
    assigned_to_name = body.assigned_to_name
    if not assigned_to_id and assigned_to_name:
        result = await db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.name == assigned_to_name,
            )
        )
        pm = result.scalar_one_or_none()
        if pm:
            assigned_to_id = str(pm.id)

    task = Task(
        project_id=project_id,
        title=body.title,
        description=body.description or "",
        assigned_to_name=assigned_to_name,
        assigned_to_id=assigned_to_id,
        priority=body.priority,
        status="todo",
        due_date=body.due_date,
        meeting_id=body.meeting_id,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _task_to_response(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, body: UpdateTaskRequest, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    await _recalculate_completion(db, task.project_id)
    await db.commit()

    return _task_to_response(task)
