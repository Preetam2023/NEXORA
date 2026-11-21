"""Copilot chat route — owned by Preetam (BE-3). SSE streaming response."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schemas import CopilotChatRequest, ConversationResponse, ListResponse

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


# ── TODO (Preetam — BE-3): implement copilot_chat ────────────────────────────
@router.post("/chat")
async def copilot_chat(body: CopilotChatRequest, db: AsyncSession = Depends(get_db)):
    # TODO: stream SSE response from Copilot Agent
    # SSE format per token: data: {"type": "token", "payload": {"text": "..."}}
    # Final event:          data: {"type": "done",  "payload": {"sources": [...]}}
    # Preetam implements — calls copilot.answer(body, db) and streams result
    raise HTTPException(status_code=501, detail="Not implemented yet — Preetam's task BE-3")


# ── TODO (Saikat — BE-CRUD): implement list_conversations ────────────────────
@router.get("/conversations", response_model=ListResponse)
async def list_conversations(db: AsyncSession = Depends(get_db)):
    # TODO: query copilot_conversations ordered by created_at desc
    raise HTTPException(status_code=501, detail="Not implemented yet")
