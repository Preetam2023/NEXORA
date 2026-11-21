"""Meeting Analyst Agent — extracts structured intelligence from a transcript.
TODO (Preetam — AI-3): implement run_meeting_analyst node.
Single LLM call that returns: summary, decisions, tasks, owners, deadlines, evidence.
"""
from __future__ import annotations

from app.agents.state import WorkflowState, MeetingAnalysis

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are a meeting intelligence analyst. Extract ALL structured information from the
meeting transcript in a single pass. Output ONLY valid JSON — no prose, no markdown.

Extract:
1. summary (2-3 sentences)
2. main_topics (list of strings)
3. decisions (each: title, description, category, status, evidence[{speaker, quote}], confidence)
4. tasks (each: title, description, assigned_to_name, priority, due_date, evidence[{speaker, quote}])
5. blockers (list of strings)
6. participants (list of names mentioned)
7. next_steps (list of strings)

RULES:
- Only extract what is EXPLICITLY stated. Never invent.
- Distinguish proposals ("let's consider X") from decisions ("we will use X").
- For evidence, quote the EXACT transcript text.
- due_date: use ISO format YYYY-MM-DD if determinable from meeting date context, else null.
- confidence: 0.0-1.0 based on explicitness of statement.
"""

USER_TEMPLATE = """\
Meeting: {title}
Type: {meeting_type}
Date: {meeting_date}
Project context: {project_context}

Transcript:
{transcript}

Respond with ONLY this JSON structure:
{{
  "summary": "...",
  "main_topics": ["..."],
  "decisions": [
    {{
      "title": "...",
      "description": "...",
      "category": "technical|architecture|business|timeline|operational|other",
      "status": "proposed|approved",
      "evidence": [{{"speaker": "...", "quote": "...", "timestamp_ref": null}}],
      "confidence": 0.9
    }}
  ],
  "tasks": [
    {{
      "title": "...",
      "description": "...",
      "assigned_to_name": "name or null",
      "priority": "low|medium|high|critical",
      "due_date": "YYYY-MM-DD or null",
      "evidence": [{{"speaker": "...", "quote": "..."}}]
    }}
  ],
  "blockers": ["..."],
  "participants": ["..."],
  "next_steps": ["..."]
}}
"""


def run_meeting_analyst(state: WorkflowState) -> dict:
    """LangGraph node — extract structured intelligence from transcript.
    TODO (Preetam — AI-3): implement this function.
    """
    # TODO: implement
    # 1. Get ai service: from app.ai.factory import get_ai_service; ai = get_ai_service()
    # 2. Build user prompt from USER_TEMPLATE with state fields
    # 3. Call ai.complete_json(system=SYSTEM_PROMPT, user=prompt)
    # 4. Parse result into MeetingAnalysis, inject meeting_id into evidence items
    # 5. Return {"meeting_analysis": MeetingAnalysis(**result)}
    raise NotImplementedError("Meeting Analyst Agent not yet implemented — Preetam AI-3")
