"""SQLAlchemy ORM models — mirrors backend/db/schema.sql."""
from __future__ import annotations

import uuid
from datetime import datetime

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
    avatar_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="active")
    health = Column(String(50), default="healthy")
    completion_percentage = Column(Integer, default=0)
    requirements = Column(Text)
    technology_stack = Column(JSONB, default=list)
    metadata = Column(JSONB, default=dict)
    created_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
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
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    name = Column(Text, nullable=False)
    email = Column(Text)
    role = Column(String(100), default="member")
    avatar_url = Column(Text)
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
    duration_mins = Column(Integer)
    transcript = Column(Text)
    transcript_url = Column(Text)
    summary = Column(Text)
    main_topics = Column(JSONB, default=list)
    participants = Column(JSONB, default=list)
    status = Column(String(50), default="pending")
    analysis_error = Column(Text)
    workflow_id = Column(Text)
    metadata = Column(JSONB, default=dict)
    uploaded_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="meetings")
    decisions = relationship("Decision", back_populates="meeting")
    tasks = relationship("Task", foreign_keys="Task.meeting_id", back_populates="source_meeting")
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
    metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="decisions")
    meeting = relationship("Meeting", back_populates="decisions")


class DecisionVersion(Base):
    __tablename__ = "decision_versions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    decision_id = Column(UUID(as_uuid=False), ForeignKey("decisions.id"), nullable=False)
    supersedes_id = Column(UUID(as_uuid=False), ForeignKey("decisions.id"))
    change_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    title = Column(String(500), nullable=False)
    description = Column(Text)
    assigned_to_name = Column(Text)
    assigned_to_id = Column(UUID(as_uuid=False), ForeignKey("project_members.id"))
    priority = Column(String(50), default="medium")
    status = Column(String(50), default="proposed")
    due_date = Column(Date)
    completed_at = Column(DateTime(timezone=True))
    evidence = Column(JSONB, default=list)
    metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="tasks")
    source_meeting = relationship("Meeting", foreign_keys=[meeting_id], back_populates="tasks")
    assignee = relationship("ProjectMember", foreign_keys=[assigned_to_id])


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    category = Column(String(100), nullable=False, default="other")
    title = Column(String(500), nullable=False)
    previous_state = Column(JSONB, default=dict)
    new_state = Column(JSONB, default=dict)
    evidence = Column(JSONB, default=list)
    severity = Column(String(50), default="medium")
    confidence = Column(Float, default=0.9)
    ai_explanation = Column(Text)
    recommendation = Column(JSONB, default=dict)
    status = Column(String(50), default="open")
    resolution_note = Column(Text)
    resolved_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="conflicts")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    entity_type = Column(Text, nullable=False)
    entity_id = Column(UUID(as_uuid=False), nullable=False)
    action = Column(Text, nullable=False)
    approved_by = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    approved_by_name = Column(Text)
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProjectState(Base):
    __tablename__ = "project_state"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    state_key = Column(String(255), nullable=False)
    state_value = Column(Text, nullable=False)
    state_category = Column(Text, default="general")
    source_meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    source_decision_id = Column(UUID(as_uuid=False), ForeignKey("decisions.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"))
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"))
    actor_name = Column(Text)
    actor_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    event_type = Column(String(100), nullable=False)
    description = Column(Text)
    entity_type = Column(Text)
    entity_id = Column(UUID(as_uuid=False))
    extra_data = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    meeting_id = Column(UUID(as_uuid=False), ForeignKey("meetings.id"), nullable=False)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    speaker = Column(Text)
    timestamp_ref = Column(Text)
    metadata = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meeting = relationship("Meeting", back_populates="transcript_chunks")


class ProjectRisk(Base):
    __tablename__ = "project_risks"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), nullable=False)
    category = Column(Text, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    severity = Column(String(50), default="medium")
    entity_type = Column(Text)
    entity_id = Column(UUID(as_uuid=False))
    is_active = Column(Boolean, default=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    metadata = Column(JSONB, default=dict)


class CopilotConversation(Base):
    __tablename__ = "copilot_conversations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"))
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"))
    title = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    messages = relationship("CopilotMessage", back_populates="conversation", cascade="all, delete-orphan")


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    conversation_id = Column(UUID(as_uuid=False), ForeignKey("copilot_conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("CopilotConversation", back_populates="messages")
