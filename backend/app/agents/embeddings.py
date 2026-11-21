"""Transcript chunk embedding pipeline — BE-4.
Splits a meeting transcript into chunks and stores pgvector embeddings.
Called after a meeting is created, before or after analysis.
"""
from __future__ import annotations

import logging
import re
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Meeting, TranscriptChunk

logger = logging.getLogger(__name__)

CHUNK_SIZE = 400       # characters per chunk
CHUNK_OVERLAP = 80     # overlap to preserve context across boundaries


def _split_transcript(transcript: str) -> list[dict]:
    """Split transcript into overlapping chunks, preserving speaker labels."""
    chunks = []
    # Try to split on speaker turns first (e.g. "Rahul: ...")
    turns = re.split(r'\n(?=[A-Z][a-z]+(?:\s[A-Z][a-z]+)?:\s)', transcript)

    buffer = ""
    current_speaker = "unknown"
    chunk_index = 0

    for turn in turns:
        # Extract speaker if present
        speaker_match = re.match(r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s', turn)
        if speaker_match:
            current_speaker = speaker_match.group(1)

        buffer += (" " if buffer else "") + turn

        while len(buffer) >= CHUNK_SIZE:
            chunk_text = buffer[:CHUNK_SIZE]
            chunks.append({
                "chunk_index": chunk_index,
                "content": chunk_text.strip(),
                "speaker": current_speaker,
            })
            buffer = buffer[CHUNK_SIZE - CHUNK_OVERLAP:]
            chunk_index += 1

    if buffer.strip():
        chunks.append({
            "chunk_index": chunk_index,
            "content": buffer.strip(),
            "speaker": current_speaker,
        })

    return chunks


async def embed_meeting_transcript(meeting_id: str, db: AsyncSession) -> int:
    """Chunk and embed a meeting transcript into transcript_chunks (BE-4).

    Returns number of chunks stored.
    Uses LiteLLM embeddings via AI Core. Falls back gracefully if embedding fails
    so the meeting analysis still works without vectors.
    """
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    if not meeting or not meeting.transcript:
        logger.warning("embed_meeting_transcript: meeting %s not found or no transcript", meeting_id)
        return 0

    # Clear existing chunks for this meeting (re-embedding is idempotent)
    await db.execute(delete(TranscriptChunk).where(TranscriptChunk.meeting_id == meeting_id))

    chunks = _split_transcript(meeting.transcript)
    if not chunks:
        return 0

    # Try to get embeddings from AI Core
    embeddings = await _get_embeddings([c["content"] for c in chunks])

    for i, chunk in enumerate(chunks):
        tc = TranscriptChunk(
            id=str(uuid.uuid4()),
            meeting_id=meeting_id,
            project_id=str(meeting.project_id),
            chunk_index=chunk["chunk_index"],
            content=chunk["content"],
            speaker=chunk["speaker"],
        )
        # Set embedding if available
        if embeddings and i < len(embeddings):
            tc.embedding = embeddings[i]
        db.add(tc)

    await db.commit()
    logger.info("embed_meeting_transcript: stored %d chunks for meeting %s", len(chunks), meeting_id)
    return len(chunks)


async def _get_embeddings(texts: list[str]) -> list | None:
    """Get embeddings via LiteLLM. Returns None on failure — caller handles gracefully."""
    try:
        import litellm
        from app.core.config import get_settings

        settings = get_settings()
        response = litellm.embedding(
            model=settings.aicore_llm_model,
            input=texts,
        )
        return [item["embedding"] for item in response.data]
    except Exception as exc:
        logger.warning("Embedding failed (pgvector search will be unavailable): %s", exc)
        return None
