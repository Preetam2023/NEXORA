"""Dashboard aggregation route — owned by Saikat (BE-CRUD-4). SQL only, no LLM."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import DashboardStats

router = APIRouter(prefix="/api", tags=["dashboard"])


# ── TODO (Saikat — BE-CRUD-4): implement get_dashboard ───────────────────────
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    # TODO: run these SQL count queries and return DashboardStats:
    #   active_projects    = SELECT COUNT(*) FROM projects WHERE status='active'
    #   meetings_analyzed  = SELECT COUNT(*) FROM meetings WHERE processing_status='completed'
    #   pending_tasks      = SELECT COUNT(*) FROM tasks WHERE status='pending'
    #   open_conflicts     = SELECT COUNT(*) FROM conflicts WHERE status='open'
    #   overdue_tasks      = SELECT COUNT(*) FROM tasks WHERE status!='completed' AND due_date < NOW()
    #   completed_tasks    = SELECT COUNT(*) FROM tasks WHERE status='completed'
    #   recent_activity    = SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10
    #   attention_items    = conflicts WHERE status='open' AND severity IN ('high','critical')
    raise HTTPException(status_code=501, detail="Not implemented yet")
