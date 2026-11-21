"""Meetings routes — create/list (Saikat BE-CRUD), analyze/SSE (Preetam BE-1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Meeting
from app.schemas.schemas import CreateMeetingRequest, MeetingResponse, ListResponse

router = APIRouter(prefix="/api", tags=["meetings"])


# ── TODO (Saikat — BE-CRUD): implement create_meeting ────────────────────────
@router.post("/projects/{project_id}/meetings", response_model=MeetingResponse, status_code=201)
async def create_meeting(project_id: str, body: CreateMeetingRequest, db: AsyncSession = Depends(get_db)):
    # TODO: create Meeting record, set processing_status="pending", commit, return
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD): implement list_meetings ─────────────────────────
@router.get("/projects/{project_id}/meetings", response_model=ListResponse)
async def list_meetings(project_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: query meetings for project ordered by meeting_date desc
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Saikat — BE-CRUD): implement get_meeting ───────────────────────────
@router.get("/meetings/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch meeting by id, 404 if not found
    raise HTTPException(status_code=501, detail="Not implemented yet")


# ── TODO (Preetam — BE-1): implement analyze_meeting ─────────────────────────
@router.post("/meetings/{meeting_id}/analyze")
async def analyze_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: kick off LangGraph workflow, return { workflow_id: str }
    # Preetam implements — triggers orchestrator.run_workflow(meeting_id, db)
    raise HTTPException(status_code=501, detail="Not implemented yet — Preetam's task BE-1")


# ── TODO (Preetam — BE-1): implement analysis SSE stream ─────────────────────
@router.get("/meetings/{meeting_id}/analysis")
async def stream_analysis(meeting_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: stream SSE events: progress → result → done
    # SSE format: data: {"type": "progress"|"result"|"error", "payload": {...}}\n\n
    # Preetam implements — polls workflow state and streams to client
    raise HTTPException(status_code=501, detail="Not implemented yet — Preetam's task BE-1")
