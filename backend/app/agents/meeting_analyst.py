"""Meeting Analyst Agent — single LLM call extracts all structured intelligence."""
from __future__ import annotations

import logging

from app.agents.state import EvidenceItem, ExtractedDecision, ExtractedTask, MeetingAnalysis, WorkflowState

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a meeting intelligence analyst. Extract ALL structured information from the
meeting transcript in a single pass. Output ONLY valid JSON — no prose, no markdown
fences.

Extract:
1. summary (2-3 sentences)
2. main_topics (list of strings)
3. decisions (each: title, description, category, status, evidence[{speaker, quote,
   timestamp_ref}], confidence)
4. tasks (each: title, description, assigned_to_name, priority, due_date,
   evidence[{speaker, quote}])
5. blockers (list of strings)
6. participants (list of names mentioned)
7. next_steps (list of strings)

RULES:
- Only extract what is EXPLICITLY stated. Never invent.
- Distinguish proposals ("let's consider X") from decisions ("we will use X").
  status="proposed" for proposals, status="approved" for confirmed decisions.
- evidence.quote must be the EXACT transcript text, verbatim.
- due_date: ISO format YYYY-MM-DD if determinable from meeting date context, else null.
- confidence: 0.0–1.0 reflecting how explicit the statement was.
- category one of: technical | architecture | business | timeline | operational | other
- priority one of: low | medium | high | critical
"""

_USER_TEMPLATE = """\
Meeting: {title}
Type: {meeting_type}
Date: {meeting_date}
Project context: {project_context}

Transcript:
{transcript}

Respond with ONLY this JSON (no markdown, no commentary):
{{
  "summary": "...",
  "main_topics": ["..."],
  "decisions": [
    {{
      "title": "...",
      "description": "...",
      "category": "technical",
      "status": "proposed",
      "evidence": [{{"speaker": "...", "quote": "...", "timestamp_ref": null}}],
      "confidence": 0.9
    }}
  ],
  "tasks": [
    {{
      "title": "...",
      "description": "...",
      "assigned_to_name": null,
      "priority": "medium",
      "due_date": null,
      "evidence": [{{"speaker": "...", "quote": "..."}}]
    }}
  ],
  "blockers": [],
  "participants": [],
  "next_steps": []
}}
"""


def run_meeting_analyst(state: WorkflowState) -> dict:
    """LangGraph node — extract structured intelligence from transcript (AI-3).

    Single LLM call: summary + decisions + tasks + owners + deadlines + evidence.
    Injects meeting_id into every EvidenceItem so downstream agents can trace back.
    """
    from app.ai.factory import get_ai_service

    ai = get_ai_service()
    meta = state.meeting_metadata
    ctx = state.project_context

    prompt = _USER_TEMPLATE.format(
        title=meta.get("title", "Untitled Meeting"),
        meeting_type=meta.get("meeting_type", "general"),
        meeting_date=meta.get("meeting_date", "unknown"),
        project_context=(
            f"Project: {ctx.get('name', '')}. "
            f"Tech stack: {ctx.get('tech_stack', '')}. "
            f"Team: {ctx.get('team_members', '')}"
        ),
        transcript=state.transcript,
    )

    logger.info("Meeting Analyst: calling LLM for meeting %s", state.meeting_id)
    raw = ai.complete_json(system=SYSTEM_PROMPT, user=prompt)

    # Inject meeting_id into all evidence items so conflict analyst can trace
    def _inject(evidence_list: list[dict]) -> list[dict]:
        for ev in evidence_list:
            ev.setdefault("meeting_id", state.meeting_id)
            ev.setdefault("meeting_title", meta.get("title", ""))
        return evidence_list

    decisions = []
    for d in raw.get("decisions", []):
        d["evidence"] = _inject(d.get("evidence", []))
        try:
            decisions.append(ExtractedDecision(**d))
        except Exception as exc:
            logger.warning("Skipping malformed decision %s: %s", d.get("title"), exc)

    tasks = []
    for t in raw.get("tasks", []):
        t["evidence"] = _inject(t.get("evidence", []))
        try:
            tasks.append(ExtractedTask(**t))
        except Exception as exc:
            logger.warning("Skipping malformed task %s: %s", t.get("title"), exc)

    analysis = MeetingAnalysis(
        summary=raw.get("summary", ""),
        main_topics=raw.get("main_topics", []),
        decisions=decisions,
        tasks=tasks,
        blockers=raw.get("blockers", []),
        participants=raw.get("participants", []),
        next_steps=raw.get("next_steps", []),
    )

    logger.info(
        "Meeting Analyst done: %d decisions, %d tasks, %d blockers",
        len(analysis.decisions), len(analysis.tasks), len(analysis.blockers),
    )
    return {"meeting_analysis": analysis}
