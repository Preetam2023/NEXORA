"""SQLAlchemy ORM models — mirrors backend/db/schema.sql."""
from __future__ import annotations

import uuid
from datetime import datetime, date

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(String(100), default="member")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    manager_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    start_date = Column(Date)
    deadline = Column(Date)
    status = Column(String(50), default="active")
    health = Column(String(50), default="on_track")
    completion_percentage = Column(Float, default=0.0)
    objectives = Column(Text)
    technology_stack = Column(JSONB, default=list)
    requirements = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="project", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    project_role = Column(String(100), default="developer")
    responsibilities = Column(Text)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="members")
    user = relationship("User")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    meeting_type = Column(String(100), default="general")
    meeting_date = Column(DateTime(timezone=True))
    transcript = Column(Text)
    participants = Column(JSONB, default=list)
    summary = Column(Text)
    processing_status = Column(String(50), default="pending")
    analysis_result = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="meetings")
    decisions = relationship("Decision", back_populates="meeting")
    tasks = relationship("Task", foreign_keys="Task.source_meeting_id", back_populates="source_meeting")
    transcript_chunks = relationship("TranscriptChunk", back_populates="meeting", cascade="all, delete-orphan")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    title = Column(String(500), nullable=False)
    description = Column(Text)
    category = Column(String(100), default="other")
    status = Column(String(50), default="proposed")
    evidence = Column(JSONB, default=list)
    confidence = Column(Float, default=0.8)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="decisions")
    meeting = relationship("Meeting", back_populates="decisions")


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    decision_id = Column(UUID(as_uuid=False), ForeignKey("decisions.id"), nullable=False)
    previous_value = Column(JSONB)
    new_value = Column(JSONB)
    change_reason = Column(Text)
    source_meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    approved_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    assigned_to = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    priority = Column(String(50), default="medium")
    status = Column(String(50), default="pending")
    due_date = Column(Date)
    source_meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    source_evidence = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="tasks")
    source_meeting = relationship("Meeting", foreign_keys=[source_meeting_id], back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assigned_to])


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(500), nullable=False)
    previous_state = Column(JSONB)
    new_state = Column(JSONB)
    evidence = Column(JSONB, default=list)
    severity = Column(String(50), default="medium")
    confidence = Column(Float, default=0.8)
    recommendation = Column(JSONB)
    status = Column(String(50), default="open")
    ai_explanation = Column(Text)
    impact_analysis = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))

    project = relationship("Project", back_populates="conflicts")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    conflict_id = Column(UUID(as_uuid=False), ForeignKey("conflicts.id"))
    proposed_change = Column(JSONB)
    approval_status = Column(String(50), default="pending")
    approved_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True))


class ProjectState(Base):
    __tablename__ = "project_state"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    state_key = Column(String(255), nullable=False)
    state_value = Column(JSONB)
    source_decision_id = Column(UUID(as_uuid=False), ForeignKey("decisions.id"))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"))
    actor_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    event_type = Column(String(100), nullable=False)
    description = Column(Text)
    extra_data = Column("metadata", JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"), nullable=False)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    speaker = Column(String(255))
    timestamp_reference = Column(String(100))
    content = Column(Text, nullable=False)
    # embedding column added by pgvector migration — stored as text here for compat
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meeting = relationship("Meeting", back_populates="transcript_chunks")


class ProjectRisk(Base):
    __tablename__ = "project_risks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(String(50), default="medium")
    source_type = Column(String(100))
    source_id = Column(UUID(as_uuid=False))
    status = Column(String(50), default="open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CopilotConversation(Base):
    __tablename__ = "copilot_conversations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"))
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    title = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    messages = relationship("CopilotMessage", back_populates="conversation", cascade="all, delete-orphan")


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    conversation_id = Column(UUID(as_uuid=False), ForeignKey("copilot_conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    sources = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("CopilotConversation", back_populates="messages")
