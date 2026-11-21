"""Conflict Analyst Agent — compares new meeting info with historical project state.
TODO (Preetam — AI-5): implement run_conflict_analyst node.
One LLM call with historical context injected — detects contradictions, changes, proposals.
"""
from __future__ import annotations

from app.agents.state import WorkflowState, ConflictRecord

SYSTEM_PROMPT = """\
You are a project conflict analyst. Compare the new meeting information with the
historical project state and identify REAL conflicts — contradictions, ownership changes,
technical decision changes, deadline changes.

RULES:
- Distinguish a PROPOSAL ("let's consider X") from a DECISION ("we will use X").
- Only flag a conflict when there is genuine inconsistency with an approved historical decision.
- For each conflict, provide evidence from BOTH the old meeting and the new meeting.
- Do not invent conflicts. If none exist, return an empty conflicts array.
- Classify severity: critical (affects project delivery), high (significant rework needed),
  medium (needs resolution), low (informational).
- Output ONLY valid JSON.
"""

USER_TEMPLATE = """\
Project requirements: {project_requirements}

Historical approved decisions:
{historical_decisions}

Current task assignments:
{current_assignments}

Current project state:
{project_state}

New meeting analysis:
{meeting_analysis}

Find conflicts and return ONLY this JSON:
{{
  "conflicts": [
    {{
      "category": "responsibility|technical_decision|deadline|scope|resource",
      "title": "...",
      "previous_state": {{"description": "...", "meeting": "..."}},
      "new_state": {{"description": "...", "meeting": "..."}},
      "evidence": [
        {{"source": "historical", "speaker": "...", "quote": "..."}},
        {{"source": "new", "speaker": "...", "quote": "..."}}
      ],
      "severity": "low|medium|high|critical",
      "confidence": 0.9,
      "ai_explanation": "...",
      "recommendation": {{
        "action": "...",
        "reason": "...",
        "alternatives": ["..."],
        "pros": ["..."],
        "cons": ["..."],
        "confidence": 0.85
      }}
    }}
  ]
}}
"""


def run_conflict_analyst(state: WorkflowState) -> dict:
    """LangGraph node — detect conflicts between new meeting and history.
    TODO (Preetam — AI-5): implement this function.
    """
    # TODO: implement
    # 1. If no historical_context or no meeting_analysis, return {"conflicts": []}
    # 2. Build prompt injecting historical_context + meeting_analysis
    # 3. Call ai.complete_json(system=SYSTEM_PROMPT, user=prompt)
    # 4. Parse result into list[ConflictRecord]
    # 5. Return {"conflicts": [ConflictRecord(**c) for c in result["conflicts"]]}
    raise NotImplementedError("Conflict Analyst not yet implemented — Preetam AI-5")
