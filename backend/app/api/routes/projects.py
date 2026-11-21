"""Projects CRUD routes — owned by Saikat (BE-CRUD-1)."""
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


# ── TODO (Saikat — BE-CRUD-1): implement create_project ──────────────────────
@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: CreateProjectRequest, db: AsyncSession = Depends(get_db)):
    # TODO: create Project ORM record from body, commit, return
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-1): implement list_projects ───────────────────────
@router.get("", response_model=ListResponse)
async def list_projects(db: AsyncSession = Depends(get_db)):
    # TODO: query all projects, count members, return { data: [...], total: n }
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-1): implement get_project ─────────────────────────
@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch project by id, 404 if not found
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-1): implement update_project ──────────────────────
@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, body: UpdateProjectRequest, db: AsyncSession = Depends(get_db)):
    # TODO: partial update project fields, commit, return
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-2): implement list_members ────────────────────────
@router.get("/{project_id}/members", response_model=ListResponse)
async def list_members(project_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: query project_members join users for this project
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD-2): implement add_member ──────────────────────────
@router.post("/{project_id}/members", response_model=MemberResponse, status_code=201)
async def add_member(project_id: str, body: CreateMemberRequest, db: AsyncSession = Depends(get_db)):
    # TODO: create/lookup user by email, create ProjectMember, commit, return
    raise HTTPException(status_code=501, detail="Not implemented yet")
