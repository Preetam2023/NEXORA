"""Projects CRUD routes — owned by Saikat (BE-CRUD-1, BE-CRUD-2)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Project, ProjectMember, User
from app.schemas.schemas import (
    CreateProjectRequest, UpdateProjectRequest, ProjectResponse, MemberResponse,
    CreateMemberRequest, ListResponse,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ── Projects ──────────────────────────────────────────────────────────────────

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    project = Project(
        name=body.name,
        description=body.description or "",
        technology_stack=body.technology_stack or [],
        requirements=body.requirements or "",
        status="active",
        health="healthy",
        completion_percentage=0,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    resp = ProjectResponse.model_validate(project)
    resp.member_count = 0
    if resp.technology_stack is None:
        resp.technology_stack = []
    return resp


@router.get("", response_model=ListResponse)
async def list_projects(db: AsyncSession = Depends(get_db)):
    stmt = select(Project).order_by(Project.created_at.desc())
    rows = (await db.execute(stmt)).scalars().all()

    projects = []
    for p in rows:
        member_count = (await db.execute(
            select(func.count()).where(ProjectMember.project_id == p.id)
        )).scalar() or 0
        resp = ProjectResponse.model_validate(p)
        resp.member_count = member_count
        if resp.technology_stack is None:
            resp.technology_stack = []
        projects.append(resp.model_dump())

    return {"data": projects, "total": len(projects)}


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    member_count = (await db.execute(
        select(func.count()).where(ProjectMember.project_id == project_id)
    )).scalar() or 0

    resp = ProjectResponse.model_validate(project)
    resp.member_count = member_count
    if resp.technology_stack is None:
        resp.technology_stack = []
    return resp


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, body: UpdateProjectRequest, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    resp = ProjectResponse.model_validate(project)
    if resp.technology_stack is None:
        resp.technology_stack = []
    return resp


# ── Members ───────────────────────────────────────────────────────────────────

@router.get("/{project_id}/members", response_model=ListResponse)
async def list_members(project_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at)
    )
    rows = (await db.execute(stmt)).scalars().all()

    members = [
        {
            "id": pm.id,
            "project_id": pm.project_id,
            "user_id": pm.user_id,
            "name": pm.name,
            "email": pm.email,
            "role": pm.role or "member",
            "avatar_url": pm.avatar_url,
            "joined_at": pm.joined_at.isoformat() if pm.joined_at else None,
        }
        for pm in rows
    ]

    return {"data": members, "total": len(members)}


@router.post("/{project_id}/members", response_model=MemberResponse, status_code=201)
async def add_member(project_id: str, body: CreateMemberRequest, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Resolve user_id if email/name provided
    user_id = body.user_id
    if not user_id and body.email:
        result = await db.execute(select(User).where(User.email == body.email))
        user = result.scalar_one_or_none()
        if user:
            user_id = user.id

    # Check for duplicate (project_id, email) — schema has UNIQUE (project_id, email)
    if body.email:
        dup_stmt = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.email == body.email,
        )
        existing = (await db.execute(dup_stmt)).scalar_one_or_none()
        if existing:
            return {
                "id": existing.id,
                "project_id": existing.project_id,
                "user_id": existing.user_id,
                "name": existing.name,
                "email": existing.email,
                "role": existing.role or "member",
                "avatar_url": existing.avatar_url,
                "joined_at": existing.joined_at,
            }

    pm = ProjectMember(
        project_id=project_id,
        user_id=user_id,
        name=body.name,
        email=body.email,
        role=body.role or "member",
    )
    db.add(pm)
    await db.commit()
    await db.refresh(pm)

    return {
        "id": pm.id,
        "project_id": pm.project_id,
        "user_id": pm.user_id,
        "name": pm.name,
        "email": pm.email,
        "role": pm.role or "member",
        "avatar_url": pm.avatar_url,
        "joined_at": pm.joined_at,
    }
