"""Conflict Analyst — detects contradictions between new meeting and project history.
AI-5 + AI-6: recommendation is generated in the same single LLM call (Option A).

Strategy: Hybrid detection.
1. Deterministic pre-check: scan new decisions for project_state key overwrites and
   responsibility-category approved-decision contradictions. These are guaranteed conflicts.
2. LLM enrichment: send all context + pre-detected conflicts to LLM to get explanations,
   evidence quotes, and recommendations. LLM may also surface additional conflicts.
"""
from __future__ import annotations

import logging
import re

from app.agents.state import (
    ConflictRecommendation,
    ConflictRecord,
    EvidenceItem,
    WorkflowState,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are a project intelligence analyst. You have been given a list of DETECTED CONFLICTS
that need full explanations and recommendations, plus contextual data to find any additional conflicts.

For EACH detected conflict and any new ones you find:
- Write a clear ai_explanation (one paragraph)
- Extract exact evidence quotes from the transcript-derived new decisions
- Provide a concrete recommendation with action, reason, alternatives, pros, cons

Do NOT re-raise conflicts listed in ALREADY RESOLVED CONFLICTS.

Output ONLY valid JSON. No markdown, no commentary.
If nothing to add beyond the detected conflicts, return them with full detail.
"""

_USER_TEMPLATE = """\
=== APPROVED PROJECT HISTORY ===
{historical_decisions}

=== PROJECT STATE (current ground truth) ===
{project_state}

=== ALREADY RESOLVED CONFLICTS (DO NOT re-raise) ===
{resolved_conflicts}

=== NEW MEETING: {meeting_title} ({meeting_date}) ===
New decisions:
{new_decisions}

New tasks:
{new_tasks}

=== DETECTED CONFLICTS (MUST include all of these in output) ===
{detected_conflicts}

=== TASK ===
1. For each DETECTED CONFLICT above, generate the full conflict JSON with explanation, evidence, and recommendation.
2. Check if there are any additional conflicts beyond the detected ones (technology, scope, resource).
   Do NOT re-raise ALREADY RESOLVED CONFLICTS.
3. Return ALL conflicts in the JSON array.

Respond with ONLY:
{{
  "conflicts": [
    {{
      "category": "responsibility|technical_decision|deadline|scope|resource",
      "title": "Short title",
      "previous_state": {{"key": "old value"}},
      "new_state": {{"key": "new value"}},
      "evidence": [{{"speaker": "Name", "quote": "exact quote", "meeting_id": null}}],
      "severity": "low|medium|high|critical",
      "confidence": 0.9,
      "ai_explanation": "One paragraph explanation.",
      "recommendation": {{
        "action": "Recommended action",
        "reason": "Why",
        "alternatives": ["Alt 1", "Alt 2"],
        "pros": ["Pro 1"],
        "cons": ["Con 1"],
        "confidence": 0.85
      }}
    }}
  ]
}}
"""


def _detect_state_conflicts(
    new_decisions: list,
    project_state: dict[str, str],
    resolved_titles: list[str],
    historical_decisions: list[dict],
) -> list[dict]:
    """Deterministically detect conflicts by comparing new decisions against project_state.

    Looks for keywords in decision titles/descriptions that indicate a state key is changing.
    Returns a list of conflict dicts (without evidence/explanation — LLM fills those in).
    """
    resolved_lower = {t.lower() for t in resolved_titles}
    detected: list[dict] = []

    # Map of project_state key → conflict category and severity
    STATE_KEY_META = {
        "backend_lead": ("responsibility", "high"),
        "frontend_lead": ("responsibility", "high"),
        "mobile_app_lead": ("responsibility", "medium"),
        "tech_lead": ("responsibility", "high"),
        "pm_lead": ("responsibility", "medium"),
        "beta_launch_target": ("deadline", "high"),
        "launch_date": ("deadline", "high"),
        "deadline": ("deadline", "medium"),
        "payment_provider": ("technical_decision", "medium"),
        "database": ("technical_decision", "medium"),
        "realtime_data_layer": ("technical_decision", "medium"),
        "persistent_data_layer": ("technical_decision", "medium"),
        "monitoring": ("technical_decision", "low"),
    }

    # Also check responsibility decisions from history
    resp_decisions = [
        d for d in historical_decisions
        if d.get("category") == "responsibility"
    ]

    new_dec_texts = [
        (d.title + " " + d.description).lower()
        for d in new_decisions
    ]
    all_new_text = " ".join(new_dec_texts)

    for key, old_val in project_state.items():
        meta = STATE_KEY_META.get(key)
        if not meta:
            continue
        category, severity = meta

        # Check if any new decision mentions this state key's current value
        # AND proposes a replacement (different person/date/technology)
        old_val_lower = old_val.lower()

        for d in new_decisions:
            combined = (d.title + " " + d.description).lower()
            # Decision must mention replacement/change and involve this key
            change_words = ["replac", "supersed", "instead", "moved to", "pushed to",
                            "changed to", "now", "acting", "new ", "appoint", "assign"]
            mentions_change = any(w in combined for w in change_words)

            # Check if the old value (person name, date, tech) is mentioned as being replaced
            mentions_old = old_val_lower in combined

            # For responsibility: check if a DIFFERENT name appears in the new decision
            # and if the old name is mentioned as being replaced
            if category == "responsibility":
                # If old person name appears in new decision text as being replaced
                if old_val_lower in combined and mentions_change:
                    title = f"Backend lead changed: {old_val} → new assignee"
                    if "backend_lead" == key:
                        # Try to find the new person's name from the decision
                        new_person = d.title.replace("Backend Lead", "").replace("Acting", "").strip()
                        title = f"Backend lead changed: {old_val} → {new_person or 'new person'}"
                    elif "mobile_app_lead" == key:
                        title = f"Mobile app lead changed: {old_val} → new assignee"
                    else:
                        title = f"Lead changed ({key}): {old_val} → new assignee"

                    conflict_key = title.lower()
                    if not any(conflict_key[:30] in r for r in resolved_lower):
                        detected.append({
                            "category": category,
                            "title": title,
                            "previous_state": {key: old_val},
                            "new_state": {"decision": d.title},
                            "severity": severity,
                        })
                        break

            elif category == "deadline":
                # Check for new date in decision description
                date_pattern = r'\b(December|January|February|March|April|May|June|July|August|September|October|November)\s+\d+|20\d\d-\d\d-\d\d|\d+th|\d+st|\d+nd|\d+rd'
                new_dates = re.findall(date_pattern, d.description, re.IGNORECASE)
                if new_dates and (old_val_lower in combined or key in combined or
                                   "launch" in combined or "deadline" in combined):
                    title = f"Launch deadline changed: {old_val} → {new_dates[0]}"
                    conflict_key = title.lower()
                    if not any(conflict_key[:30] in r for r in resolved_lower):
                        detected.append({
                            "category": category,
                            "title": title,
                            "previous_state": {key: old_val},
                            "new_state": {key: new_dates[0]},
                            "severity": severity,
                        })
                        break

            elif category == "technical_decision":
                # Technology replacement: old tech name appears as being replaced
                if old_val_lower in combined and mentions_change:
                    title = f"Technology changed ({key}): {old_val} → new choice"
                    conflict_key = title.lower()
                    if not any(conflict_key[:25] in r for r in resolved_lower):
                        detected.append({
                            "category": category,
                            "title": title,
                            "previous_state": {key: old_val},
                            "new_state": {"decision": d.title},
                            "severity": severity,
                        })
                        break

    logger.info("Deterministic pre-check found %d candidate conflicts", len(detected))
    return detected


def run_conflict_analyst(state: WorkflowState) -> dict:
    """LangGraph node — detect conflicts vs historical context (AI-5 + AI-6)."""
    from app.ai.factory import get_ai_service

    if not state.meeting_analysis or not state.historical_context:
        logger.warning("Conflict Analyst: missing meeting_analysis or historical_context — skipping")
        return {"conflicts": []}

    ai = get_ai_service()
    hist = state.historical_context
    analysis = state.meeting_analysis
    meta = state.meeting_metadata

    resolved_titles = state.existing_conflict_titles

    # ── Deterministic pre-detection ──────────────────────────────────────────
    pre_detected = _detect_state_conflicts(
        new_decisions=analysis.decisions,
        project_state=hist.project_state,
        resolved_titles=resolved_titles,
        historical_decisions=hist.previous_decisions,
    )

    hist_dec_text = (
        "\n".join(
            f"- [{d['category']}] {d['title']}: {d['description']}"
            for d in hist.previous_decisions
        )
        or "(no approved decisions yet)"
    )

    state_text = (
        "\n".join(f"  {k}: {v}" for k, v in hist.project_state.items())
        or "(empty — first meeting)"
    )

    new_dec_text = (
        "\n".join(
            f"- [{d.category}] {d.title}: {d.description}"
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

    if pre_detected:
        detected_text = "\n".join(
            f"- [{c['category']}] [{c['severity']}] {c['title']}\n"
            f"  Previous: {c['previous_state']}\n"
            f"  New: {c['new_state']}"
            for c in pre_detected
        )
    else:
        detected_text = "(none pre-detected — check for conflicts yourself)"

    prompt = _USER_TEMPLATE.format(
        historical_decisions=hist_dec_text,
        project_state=state_text,
        resolved_conflicts="\n".join(f"- {t}" for t in resolved_titles) or "(none yet)",
        meeting_title=meta.get("title", ""),
        meeting_date=meta.get("meeting_date", ""),
        new_decisions=new_dec_text,
        new_tasks=new_task_text,
        detected_conflicts=detected_text,
    )

    logger.info("Conflict Analyst: calling LLM for meeting %s (pre-detected: %d)", state.meeting_id, len(pre_detected))
    with open('/tmp/conflict_analyst_prompt.txt', 'w') as _f:
        _f.write(f"=== SYSTEM ===\n{SYSTEM_PROMPT}\n\n=== USER ===\n{prompt}\n")
    raw = ai.complete_json(system=SYSTEM_PROMPT, user=prompt)
    with open('/tmp/conflict_analyst_response.txt', 'w') as _f:
        import json as _json
        _f.write(_json.dumps(raw, indent=2))
    logger.info("Conflict Analyst raw LLM conflicts: %d", len(raw.get("conflicts", [])))

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
