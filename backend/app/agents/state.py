"""LangGraph workflow state — shared across all agent nodes.
All agents read from and write partial updates to WorkflowState.
"""
from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    meeting_id: str
    meeting_title: str = ""
    speaker: str
    timestamp_ref: str | None = None
    quote: str


class ExtractedDecision(BaseModel):
    title: str
    description: str
    category: str = "other"          # technical|architecture|business|timeline|operational|other
    status: str = "proposed"         # proposed|approved
    evidence: list[EvidenceItem] = []
    confidence: float = 0.8


class ExtractedTask(BaseModel):
    title: str
    description: str
    assigned_to_name: str | None = None
    priority: str = "medium"         # low|medium|high|critical
    due_date: str | None = None      # ISO date string or None
    evidence: list[EvidenceItem] = []


class MeetingAnalysis(BaseModel):
    summary: str = ""
    main_topics: list[str] = []
    decisions: list[ExtractedDecision] = []
    tasks: list[ExtractedTask] = []
    blockers: list[str] = []
    participants: list[str] = []
    next_steps: list[str] = []


class ConflictRecommendation(BaseModel):
    action: str
    reason: str
    alternatives: list[str] = []
    pros: list[str] = []
    cons: list[str] = []
    confidence: float = 0.8


class ConflictRecord(BaseModel):
    category: str                    # responsibility|technical_decision|deadline|scope|resource
    title: str
    previous_state: dict[str, Any] = {}
    new_state: dict[str, Any] = {}
    evidence: list[EvidenceItem] = []
    severity: str = "medium"         # low|medium|high|critical
    confidence: float = 0.8
    ai_explanation: str = ""
    recommendation: ConflictRecommendation | None = None
    impact_analysis: dict[str, Any] = {}


class HistoricalContext(BaseModel):
    previous_decisions: list[dict[str, Any]] = []
    current_assignments: list[dict[str, Any]] = []
    existing_tasks: list[dict[str, Any]] = []
    project_state: dict[str, Any] = {}
    project_requirements: str = ""


class WorkflowState(BaseModel):
    """Shared state passed through all LangGraph nodes."""
    workflow_id: str
    project_id: str
    meeting_id: str
    transcript: str = ""
    meeting_metadata: dict[str, Any] = {}
    project_context: dict[str, Any] = {}

    # Filled by Meeting Analyst node
    meeting_analysis: MeetingAnalysis | None = None

    # Filled by Memory Agent node
    historical_context: HistoricalContext | None = None

    # Filled by Conflict Analyst node
    conflicts: list[ConflictRecord] = []

    # Filled by Impact Analysis node
    impact_reports: list[dict[str, Any]] = []

    # Set by Approval Gate — human must approve before execution
    approval_status: str = "pending"   # pending|approved|rejected
    approved_changes: list[dict[str, Any]] = []

    # Filled by Execution Agent after approval
    execution_result: dict[str, Any] | None = None

    # Errors accumulated during workflow
    errors: list[str] = []
