"""Decisions read + approve/reject routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ActivityLog, Decision
from app.schemas.schemas import DecisionResponse, ListResponse, EvidenceItem

router = APIRouter(prefix="/api", tags=["decisions"])


class DecisionStatusUpdate(BaseModel):
    status: str  # "approved" | "rejected"


def _decision_to_response(d: Decision) -> dict:
    evidence = []
    if d.evidence:
        raw = d.evidence if isinstance(d.evidence, list) else []
        for item in raw:
            if isinstance(item, dict):
                evidence.append({
                    "meeting_id": item.get("meeting_id", ""),
                    "meeting_title": item.get("meeting_title", ""),
                    "speaker": item.get("speaker", ""),
                    "timestamp_ref": item.get("timestamp_ref"),
                    "quote": item.get("quote", ""),
                })

    return {
        "id": d.id,
        "project_id": d.project_id,
        "meeting_id": d.meeting_id,
        "title": d.title,
        "description": d.description,
        "category": d.category or "other",
        "status": d.status or "proposed",
        "evidence": evidence,
        "confidence": d.confidence or 0.8,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


@router.get("/projects/{project_id}/decisions", response_model=ListResponse)
async def list_decisions(project_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Decision)
        .where(Decision.project_id == project_id)
        .order_by(Decision.created_at.desc())
    )
    decisions = (await db.execute(stmt)).scalars().all()
    data = [_decision_to_response(d) for d in decisions]
    return {"data": data, "total": len(data)}


@router.get("/decisions/{decision_id}", response_model=DecisionResponse)
async def get_decision(decision_id: str, db: AsyncSession = Depends(get_db)):
    decision = await db.get(Decision, decision_id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return _decision_to_response(decision)


@router.patch("/decisions/{decision_id}")
async def update_decision_status(
    decision_id: str,
    body: DecisionStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a proposed decision."""
    decision = await db.get(Decision, decision_id)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    if body.status not in ("approved", "rejected"):
        raise HTTPException(status_code=422, detail="status must be 'approved' or 'rejected'")

    decision.status = body.status
    db.add(ActivityLog(
        project_id=decision.project_id,
        action=f"decision_{body.status}",
        summary=f"Decision {body.status}: {decision.title}",
        extra_data={"decision_id": decision_id},
    ))
    await db.commit()
    return _decision_to_response(decision)
