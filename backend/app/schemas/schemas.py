"""Pydantic schemas — request/response shapes for all API endpoints.
TypeScript equivalents live in frontend/src/types/api.ts — keep in sync.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any
from pydantic import BaseModel


# ── Shared ────────────────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    meeting_id: str = ""
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
    technology_stack: list[str] = []
    requirements: str = ""


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    health: str | None = None
    completion_percentage: int | None = None
    technology_stack: list[str] | None = None
    requirements: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    status: str
    health: str
    completion_percentage: int
    technology_stack: list[str] = []
    requirements: str | None = None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Members ───────────────────────────────────────────────────────────────────

class CreateMemberRequest(BaseModel):
    user_id: str | None = None
    name: str
    email: str = ""
    role: str = "member"


class MemberResponse(BaseModel):
    id: str
    project_id: str
    user_id: str | None = None
    name: str = ""
    email: str | None = None
    role: str = "member"
    avatar_url: str | None = None
    joined_at: datetime

    model_config = {"from_attributes": True}


# ── Meetings ──────────────────────────────────────────────────────────────────

class CreateMeetingRequest(BaseModel):
    title: str
    meeting_type: str = "general"
    meeting_date: datetime | None = None
    participants: list[str] = []
    transcript: str = ""


class MeetingResponse(BaseModel):
    id: str
    project_id: str
    title: str
    meeting_type: str
    meeting_date: datetime | None = None
    duration_mins: int | None = None
    status: str
    summary: str | None = None
    transcript: str | None = None
    participants: list[str] = []
    main_topics: list[str] = []
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Decisions ─────────────────────────────────────────────────────────────────

class DecisionResponse(BaseModel):
    id: str
    project_id: str
    meeting_id: str | None = None
    title: str
    description: str | None = None
    category: str
    status: str
    evidence: list[EvidenceItem] = []
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
    previous_state: dict[str, Any] | None = None
    new_state: dict[str, Any] | None = None
    evidence: list[dict[str, Any]] = []
    severity: str
    confidence: float
    recommendation: ConflictRecommendation | None = None
    ai_explanation: str | None = None
    status: str
    resolved_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolveConflictRequest(BaseModel):
    resolution: str
    approved_by: str = "demo_user"


# ── Tasks ─────────────────────────────────────────────────────────────────────

class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    assigned_to_name: str | None = None
    assigned_to_id: str | None = None
    priority: str = "medium"
    due_date: date | None = None
    meeting_id: str | None = None


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_to_name: str | None = None
    assigned_to_id: str | None = None
    priority: str | None = None
    status: str | None = None
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: str
    project_id: str
    meeting_id: str | None = None
    title: str
    description: str | None = None
    assigned_to_name: str | None = None
    assigned_to_id: str | None = None
    priority: str
    status: str
    due_date: date | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard ─────────────────────────────────────────────────────────────────

class AttentionItem(BaseModel):
    type: str
    severity: str
    title: str
    project_id: str
    project_name: str = ""
    entity_id: str = ""


class ActivityItem(BaseModel):
    id: str
    project_id: str = ""
    actor_name: str | None = None
    action: str
    summary: str | None = None
    entity_type: str | None = None
    created_at: datetime


class DashboardStats(BaseModel):
    active_projects: int
    meetings_analyzed: int
    pending_tasks: int
    open_conflicts: int
    projects: list[Any] = []
    attention_items: list[AttentionItem] = []
    recent_activity: list[ActivityItem] = []


# ── Risks ─────────────────────────────────────────────────────────────────────

class RiskResponse(BaseModel):
    id: str
    project_id: str
    category: str
    title: str
    description: str | None = None
    severity: str
    entity_type: str | None = None
    is_active: bool = True
    detected_at: datetime

    model_config = {"from_attributes": True}


# ── Copilot ───────────────────────────────────────────────────────────────────

class CopilotChatRequest(BaseModel):
    project_id: str | None = None
    message: str
    conversation_id: str | None = None


class ConversationResponse(BaseModel):
    id: str
    project_id: str | None = None
    title: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Project State ─────────────────────────────────────────────────────────────

class ProjectStateResponse(BaseModel):
    id: str
    project_id: str
    state_key: str
    state_value: str
    state_category: str = "general"
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Generic list wrapper ──────────────────────────────────────────────────────

class ListResponse(BaseModel):
    data: list[Any]
    total: int
