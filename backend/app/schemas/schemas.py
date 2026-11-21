"""Pydantic schemas — request/response shapes for all API endpoints.
TypeScript equivalents live in frontend/src/types/api.ts — keep in sync.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, Field


# ── Shared ────────────────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    meeting_id: str
    meeting_title: str = ""
    speaker: str
    timestamp_ref: str | None = None
    quote: str


class ConflictRecommendation(BaseModel):
    action: str
    reason: str
    alternatives: list[str] = []
    pros: list[str] = []
    cons: list[str] = []
    confidence: float = 0.8


# ── Users ─────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Projects ──────────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""
    manager_id: str
    start_date: date
    deadline: date
    objectives: str = ""
    technology_stack: list[str] = []
    requirements: str = ""


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    deadline: date | None = None
    status: str | None = None
    objectives: str | None = None
    technology_stack: list[str] | None = None
    requirements: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    manager_id: str | None
    start_date: date | None
    deadline: date | None
    status: str
    health: str
    completion_percentage: float
    objectives: str | None
    technology_stack: list[str] | None
    requirements: str | None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Members ───────────────────────────────────────────────────────────────────

class CreateMemberRequest(BaseModel):
    user_id: str | None = None
    name: str                           # used to create/lookup user
    email: str
    project_role: str = "developer"
    responsibilities: str = ""


class MemberResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    name: str = ""
    email: str = ""
    project_role: str
    responsibilities: str | None
    joined_at: datetime

    model_config = {"from_attributes": True}


# ── Meetings ──────────────────────────────────────────────────────────────────

class CreateMeetingRequest(BaseModel):
    title: str
    meeting_type: str = "general"
    meeting_date: datetime
    participants: list[str] = []
    transcript: str


class MeetingResponse(BaseModel):
    id: str
    project_id: str
    title: str
    meeting_type: str
    meeting_date: datetime | None
    processing_status: str
    summary: str | None
    participants: list[str] | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Decisions ─────────────────────────────────────────────────────────────────

class DecisionResponse(BaseModel):
    id: str
    project_id: str
    meeting_id: str | None
    title: str
    description: str | None
    category: str
    status: str
    evidence: list[EvidenceItem] | None = []
    confidence: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Conflicts ─────────────────────────────────────────────────────────────────

class ConflictResponse(BaseModel):
    id: str
    project_id: str
    category: str
    title: str
    previous_state: dict[str, Any] | None
    new_state: dict[str, Any] | None
    evidence: list[EvidenceItem] | None = []
    severity: str
    confidence: float
    recommendation: ConflictRecommendation | None
    ai_explanation: str | None
    impact_analysis: dict[str, Any] | None
    status: str
    created_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class ResolveConflictRequest(BaseModel):
    resolution: str
    approved_by: str = "demo_user"


# ── Tasks ─────────────────────────────────────────────────────────────────────

class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    assigned_to: str | None = None
    priority: str = "medium"
    due_date: date | None = None


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_to: str | None = None
    priority: str | None = None
    status: str | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None
    assigned_to: str | None
    assigned_name: str | None = None
    priority: str
    status: str
    due_date: date | None
    source_meeting_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class AttentionItem(BaseModel):
    type: str
    title: str
    severity: str
    project_id: str
    resource_id: str
    created_at: datetime


class ActivityItem(BaseModel):
    id: str
    event_type: str
    description: str | None
    project_name: str = ""
    created_at: datetime


class DashboardStats(BaseModel):
    active_projects: int
    meetings_analyzed: int
    pending_tasks: int
    open_conflicts: int
    overdue_tasks: int
    completed_tasks: int
    recent_activity: list[ActivityItem] = []
    attention_items: list[AttentionItem] = []


# ── Risks ─────────────────────────────────────────────────────────────────────

class RiskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None
    severity: str
    source_type: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Copilot ───────────────────────────────────────────────────────────────────

class CopilotChatRequest(BaseModel):
    project_id: str | None = None
    message: str
    conversation_id: str | None = None


class ConversationResponse(BaseModel):
    id: str
    project_id: str | None
    title: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Project State ─────────────────────────────────────────────────────────────

class ProjectStateResponse(BaseModel):
    id: str
    project_id: str
    state_key: str
    state_value: Any
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Generic list wrapper ──────────────────────────────────────────────────────

class ListResponse(BaseModel):
    data: list[Any]
    total: int
