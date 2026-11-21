"""Meetings routes — create/list (Saikat BE-CRUD), analyze/SSE (Preetam BE-1)."""
from __future__ import annotations

import asyncio
import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionFactory, get_db
from app.models.models import Meeting
from app.schemas.schemas import CreateMeetingRequest, ListResponse, MeetingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["meetings"])


# ── Saikat — BE-CRUD ──────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/meetings", response_model=MeetingResponse, status_code=201)
async def create_meeting(
    project_id: str,
    body: CreateMeetingRequest,
    db: AsyncSession = Depends(get_db),
):
    meeting = Meeting(
        id=str(uuid.uuid4()),
        project_id=project_id,
        title=body.title,
        meeting_type=body.meeting_type,
        meeting_date=body.meeting_date,
        participants=body.participants,
        transcript=body.transcript,
        processing_status="pending",
    )
    db.add(meeting)
    await db.commit()
    await db.refresh(meeting)
    return meeting


@router.get("/projects/{project_id}/meetings", response_model=ListResponse)
async def list_meetings(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Meeting)
        .where(Meeting.project_id == project_id)
        .order_by(Meeting.meeting_date.desc())
    )
    meetings = result.scalars().all()
    return {"data": [MeetingResponse.model_validate(m) for m in meetings], "total": len(meetings)}


@router.get("/meetings/{meeting_id}", response_model=MeetingResponse)
async def get_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# ── Preetam — BE-1 ────────────────────────────────────────────────────────────

@router.post("/meetings/{meeting_id}/analyze")
async def analyze_meeting(meeting_id: str, db: AsyncSession = Depends(get_db)):
    """Trigger LangGraph workflow. Returns workflow_id immediately."""
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if not meeting.transcript:
        raise HTTPException(status_code=422, detail="Meeting has no transcript to analyze")

    if meeting.processing_status == "analysis_complete":
        return {"workflow_id": meeting.analysis_result.get("workflow_id", ""), "status": "already_complete"}

    meeting.processing_status = "processing"
    await db.commit()

    workflow_id = str(uuid.uuid4())
    # Fire-and-forget: run workflow in background so endpoint returns immediately
    asyncio.create_task(_run_workflow_background(meeting_id, workflow_id))

    return {"workflow_id": workflow_id, "status": "started"}


async def _run_workflow_background(meeting_id: str, workflow_id: str) -> None:
    """Run the orchestrator workflow in background, isolated DB session."""
    from app.agents.orchestrator import run_workflow

    async with AsyncSessionFactory() as db:
        try:
            await run_workflow(meeting_id, db)
        except Exception as exc:
            logger.error("Background workflow failed for meeting %s: %s", meeting_id, exc)
            result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
            meeting = result.scalar_one_or_none()
            if meeting:
                meeting.processing_status = "error"
                meeting.analysis_result = {"error": str(exc)}
                await db.commit()


@router.get("/meetings/{meeting_id}/analysis")
async def stream_analysis(meeting_id: str, db: AsyncSession = Depends(get_db)):
    """SSE stream: polls DB for analysis completion and streams progress + result."""
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return StreamingResponse(
        _analysis_sse_generator(meeting_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


async def _analysis_sse_generator(meeting_id: str):
    """Yields SSE events for meeting analysis progress."""
    from app.models.models import Conflict, Decision, Task

    def sse(type_: str, payload: dict) -> str:
        return f"data: {json.dumps({'type': type_, 'payload': payload})}\n\n"

    yield sse("progress", {"message": "Starting analysis...", "step": 1, "total_steps": 4})

    max_polls = 60  # 60 × 2s = 2 minutes max
    poll_count = 0

    while poll_count < max_polls:
        await asyncio.sleep(2)
        poll_count += 1

        async with AsyncSessionFactory() as db:
            result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
            meeting = result.scalar_one_or_none()
            if not meeting:
                yield sse("error", {"message": "Meeting not found"})
                return

            status = meeting.processing_status

            if status == "processing":
                step = min(1 + poll_count // 5, 3)
                messages = {1: "Analyzing transcript...", 2: "Detecting conflicts...", 3: "Preparing results..."}
                yield sse("progress", {"message": messages.get(step, "Processing..."), "step": step, "total_steps": 4})

            elif status == "analysis_complete":
                analysis = meeting.analysis_result or {}
                # Load full results for the response
                dec_result = await db.execute(
                    select(Decision).where(
                        Decision.meeting_id == meeting_id,
                        Decision.project_id == meeting.project_id,
                    )
                )
                task_result = await db.execute(
                    select(Task).where(
                        Task.source_meeting_id == meeting_id,
                        Task.project_id == meeting.project_id,
                    )
                )
                conflict_result = await db.execute(
                    select(Conflict).where(Conflict.project_id == meeting.project_id)
                    .order_by(Conflict.created_at.desc())
                    .limit(analysis.get("conflicts", 0) + 5)
                )

                decisions = dec_result.scalars().all()
                tasks = task_result.scalars().all()
                conflicts = conflict_result.scalars().all()

                yield sse("progress", {"message": "Analysis complete!", "step": 4, "total_steps": 4})
                yield sse("result", {
                    "workflow_id": analysis.get("workflow_id", ""),
                    "summary": meeting.summary or "",
                    "participants": meeting.participants or [],
                    "decisions": [
                        {
                            "id": str(d.id), "title": d.title, "description": d.description,
                            "category": d.category, "status": d.status, "confidence": d.confidence,
                            "evidence": d.evidence or [],
                        }
                        for d in decisions
                    ],
                    "tasks": [
                        {
                            "id": str(t.id), "title": t.title, "description": t.description,
                            "priority": t.priority, "status": t.status,
                            "due_date": t.due_date.isoformat() if t.due_date else None,
                            "source_evidence": t.source_evidence or [],
                        }
                        for t in tasks
                    ],
                    "conflicts": [
                        {
                            "id": str(c.id), "title": c.title, "category": c.category,
                            "severity": c.severity, "confidence": c.confidence,
                            "ai_explanation": c.ai_explanation, "status": c.status,
                            "recommendation": c.recommendation,
                            "impact_analysis": c.impact_analysis,
                        }
                        for c in conflicts
                    ],
                })
                yield sse("done", {"meeting_id": meeting_id})
                return

            elif status == "error":
                error_detail = (meeting.analysis_result or {}).get("error", "Analysis failed")
                yield sse("error", {"message": error_detail})
                return

    yield sse("error", {"message": "Analysis timed out — check server logs"})
