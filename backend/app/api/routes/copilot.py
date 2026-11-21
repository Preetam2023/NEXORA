"""Copilot chat route — owned by Preetam (BE-3). SSE streaming response."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import CopilotConversation
from app.schemas.schemas import ConversationResponse, CopilotChatRequest, ListResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/copilot", tags=["copilot"])


@router.post("/chat")
async def copilot_chat(body: CopilotChatRequest, db: AsyncSession = Depends(get_db)):
    """Stream copilot response as SSE. Each token: data: {type:token, payload:{text:...}}"""
    if not body.project_id:
        raise HTTPException(status_code=422, detail="project_id is required")
    if not body.message or not body.message.strip():
        raise HTTPException(status_code=422, detail="message is required")

    from app.agents.copilot import answer

    return StreamingResponse(
        answer(
            project_id=body.project_id,
            message=body.message.strip(),
            conversation_id=body.conversation_id,
            db=db,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations", response_model=ListResponse)
async def list_conversations(project_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(CopilotConversation).order_by(CopilotConversation.created_at.desc())
    if project_id:
        q = q.where(CopilotConversation.project_id == project_id)
    result = await db.execute(q)
    convs = result.scalars().all()
    return {"data": [ConversationResponse.model_validate(c) for c in convs], "total": len(convs)}
