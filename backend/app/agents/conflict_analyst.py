"""Conflict Analyst — detects contradictions between new meeting and project history.
AI-5 + AI-6: recommendation is generated in the same single LLM call (Option A).
"""
from __future__ import annotations

import logging

from app.agents.state import (
    ConflictRecommendation,
    ConflictRecord,
    EvidenceItem,
    WorkflowState,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a project intelligence analyst specialising in detecting conflicts between
new meeting decisions and established project history.

A CONFLICT exists when a new decision or task assignment directly contradicts,
replaces, or is inconsistent with an already-approved decision or existing
assignment — especially:
- Technology changes  (e.g. MongoDB → PostgreSQL)
- Ownership changes   (e.g. Arjun was DB lead, now Sanchita is)
- Deadline changes    (original deadline vs new one)
- Scope changes       (feature added / removed vs original scope)
- Resource changes    (budget, headcount reassignment)

For each conflict output ONLY valid JSON (no markdown). Include a recommendation
with concrete action, reason, alternatives, pros, and cons so the team can decide.

If there are no conflicts output: {"conflicts": []}
"""

_USER_TEMPLATE = """\
=== APPROVED PROJECT HISTORY ===
{historical_decisions}

=== CURRENT ASSIGNMENTS (active tasks) ===
{current_assignments}

=== PROJECT STATE (key-value truth) ===
{project_state}

=== NEW MEETING ANALYSIS ===
Meeting: {meeting_title}  Date: {meeting_date}
New decisions proposed:
{new_decisions}

New task assignments:
{new_tasks}

=== TASK ===
Identify every conflict between the new meeting content and the established history.
For each conflict provide a clear recommendation with action options.

Respond with ONLY this JSON (no markdown, no commentary):
{{
  "conflicts": [
    {{
      "category": "responsibility|technical_decision|deadline|scope|resource",
      "title": "Short conflict title",
      "previous_state": {{"key": "value describing what was decided before"}},
      "new_state": {{"key": "value describing what the new meeting proposes"}},
      "evidence": [
        {{"speaker": "...", "quote": "exact quote from transcript", "meeting_id": null}}
      ],
      "severity": "low|medium|high|critical",
      "confidence": 0.9,
      "ai_explanation": "One paragraph explaining the conflict and its implications.",
      "recommendation": {{
        "action": "Recommended action in one sentence",
        "reason": "Why this action is recommended",
        "alternatives": ["Alternative 1", "Alternative 2"],
        "pros": ["Pro 1", "Pro 2"],
        "cons": ["Con 1"],
        "confidence": 0.85
      }}
    }}
  ]
}}
"""


def run_conflict_analyst(state: WorkflowState) -> dict:
    """LangGraph node — detect conflicts vs historical context (AI-5 + AI-6).

    Single LLM call with historical context injected. Recommendation is included
    in the same response — faster, avoids a second round-trip.
    """
    from app.ai.factory import get_ai_service

    if not state.meeting_analysis or not state.historical_context:
        logger.warning("Conflict Analyst: missing meeting_analysis or historical_context — skipping")
        return {"conflicts": []}

    ai = get_ai_service()
    hist = state.historical_context
    analysis = state.meeting_analysis
    meta = state.meeting_metadata

    hist_dec_text = (
        "\n".join(
            f"- [{d['category']}] {d['title']}: {d['description']}"
            for d in hist.previous_decisions
        )
        or "(no approved decisions yet)"
    )

    assign_text = (
        "\n".join(
            f"- {t['title']} → {t['assigned_to_name'] or 'unassigned'} ({t['status']})"
            for t in hist.current_assignments
        )
        or "(no active assignments)"
    )

    state_text = (
        "\n".join(f"  {k}: {v}" for k, v in hist.project_state.items())
        or "(empty — first meeting)"
    )

    new_dec_text = (
        "\n".join(
            f"- [{d.category}/{d.status}] {d.title}: {d.description}"
            for d in analysis.decisions
        )
        or "(none)"
    )

    new_task_text = (
        "\n".join(
            f"- {t.title} → {t.assigned_to_name or 'unassigned'} (due: {t.due_date or 'TBD'})"
            for t in analysis.tasks
        )
        or "(none)"
    )

    prompt = _USER_TEMPLATE.format(
        historical_decisions=hist_dec_text,
        current_assignments=assign_text,
        project_state=state_text,
        meeting_title=meta.get("title", ""),
        meeting_date=meta.get("meeting_date", ""),
        new_decisions=new_dec_text,
        new_tasks=new_task_text,
    )

    logger.info("Conflict Analyst: calling LLM for meeting %s", state.meeting_id)
    raw = ai.complete_json(system=SYSTEM_PROMPT, user=prompt)

    conflicts: list[ConflictRecord] = []
    for c in raw.get("conflicts", []):
        for ev in c.get("evidence", []):
            ev.setdefault("meeting_id", state.meeting_id)
            ev.setdefault("meeting_title", meta.get("title", ""))

        rec_raw = c.get("recommendation")
        recommendation = None
        if rec_raw:
            try:
                recommendation = ConflictRecommendation(**rec_raw)
            except Exception as exc:
                logger.warning("Malformed recommendation for conflict %s: %s", c.get("title"), exc)

        try:
            conflicts.append(
                ConflictRecord(
                    category=c.get("category", "other"),
                    title=c.get("title", "Unnamed conflict"),
                    previous_state=c.get("previous_state", {}),
                    new_state=c.get("new_state", {}),
                    evidence=[EvidenceItem(**ev) for ev in c.get("evidence", [])],
                    severity=c.get("severity", "medium"),
                    confidence=c.get("confidence", 0.8),
                    ai_explanation=c.get("ai_explanation", ""),
                    recommendation=recommendation,
                )
            )
        except Exception as exc:
            logger.warning("Skipping malformed conflict %s: %s", c.get("title"), exc)

    logger.info("Conflict Analyst done: %d conflicts detected", len(conflicts))
    return {"conflicts": conflicts}
