-- NEXORA — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (project → SQL Editor → New query)
-- Enable pgvector first: CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'member',  -- admin | member
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    description             TEXT,
    status                  TEXT NOT NULL DEFAULT 'active',  -- active | completed | on_hold | archived
    health                  TEXT NOT NULL DEFAULT 'healthy',  -- healthy | at_risk | critical
    completion_percentage   INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    requirements            TEXT,
    technology_stack        JSONB DEFAULT '[]',
    metadata                JSONB DEFAULT '{}',
    created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Project Members
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,  -- denormalised for display (may not have user account)
    email       TEXT,
    role        TEXT NOT NULL DEFAULT 'member',  -- pm | developer | designer | qa | devops | other
    avatar_url  TEXT,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, email)
);

-- ─────────────────────────────────────────────
-- Meetings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    meeting_type    TEXT NOT NULL DEFAULT 'general',  -- sprint_planning | standup | retrospective | technical_review | general
    meeting_date    TIMESTAMPTZ,
    duration_mins   INTEGER,
    transcript      TEXT,
    transcript_url  TEXT,  -- future: S3/storage URL
    summary         TEXT,
    main_topics     JSONB DEFAULT '[]',
    participants    JSONB DEFAULT '[]',
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending | analyzing | analyzed | failed
    processing_status TEXT DEFAULT 'pending',
    analysis_result JSONB DEFAULT '{}',
    analysis_error  TEXT,
    workflow_id     TEXT,  -- LangGraph run ID
    metadata        JSONB DEFAULT '{}',
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Decisions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id      UUID REFERENCES meetings(id) ON DELETE SET NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL DEFAULT 'other',  -- technical | architecture | business | timeline | operational | other
    status          TEXT NOT NULL DEFAULT 'proposed',  -- proposed | approved | rejected | superseded
    evidence        JSONB DEFAULT '[]',  -- [{speaker, quote, timestamp_ref}]
    confidence      FLOAT DEFAULT 0.9,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track when a decision supersedes an older one
CREATE TABLE IF NOT EXISTS decision_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_id     UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    supersedes_id   UUID REFERENCES decisions(id) ON DELETE SET NULL,
    change_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Tasks
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id          UUID REFERENCES meetings(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    assigned_to_name    TEXT,
    assigned_to_id      UUID REFERENCES project_members(id) ON DELETE SET NULL,
    priority            TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
    status              TEXT NOT NULL DEFAULT 'proposed',  -- proposed | todo | in_progress | blocked | completed | cancelled
    due_date            DATE,
    completed_at        TIMESTAMPTZ,
    evidence            JSONB DEFAULT '[]',
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Conflicts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conflicts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id      UUID REFERENCES meetings(id) ON DELETE SET NULL,
    category        TEXT NOT NULL DEFAULT 'other',  -- responsibility | technical_decision | deadline | scope | resource | other
    title           TEXT NOT NULL,
    previous_state  JSONB DEFAULT '{}',  -- {description, meeting_title, meeting_date}
    new_state       JSONB DEFAULT '{}',  -- {description, meeting_title, meeting_date}
    evidence        JSONB DEFAULT '[]',  -- [{source: "historical"|"new", speaker, quote}]
    severity        TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
    confidence      FLOAT DEFAULT 0.9,
    ai_explanation  TEXT,
    recommendation  JSONB DEFAULT '{}',  -- {action, reason, alternatives, pros, cons, confidence}
    status          TEXT NOT NULL DEFAULT 'open',  -- open | resolved | rejected | ignored
    resolution_note TEXT,
    resolved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Approvals (audit trail for approve/reject actions)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id      UUID REFERENCES meetings(id) ON DELETE SET NULL,
    entity_type     TEXT NOT NULL,  -- decision | task | conflict_resolution
    entity_id       UUID NOT NULL,
    action          TEXT NOT NULL,  -- approved | rejected
    approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by_name TEXT,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Project State (key-value store for current project facts)
-- e.g. database_technology=postgresql, assigned_db_engineer=sanchita
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_state (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    state_key       TEXT NOT NULL,
    state_value     TEXT NOT NULL,
    state_category  TEXT DEFAULT 'general',  -- technical | personnel | timeline | general
    source_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    source_decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, state_key)
);

-- ─────────────────────────────────────────────
-- Activity Logs (immutable audit trail)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id  UUID REFERENCES meetings(id) ON DELETE SET NULL,
    actor_name  TEXT,
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,  -- meeting_analyzed | decision_approved | conflict_resolved | task_created | ...
    entity_type TEXT,
    entity_id   UUID,
    summary     TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Transcript Chunks (pgvector — for semantic copilot search)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcript_chunks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content     TEXT NOT NULL,
    speaker     TEXT,
    timestamp_ref TEXT,
    embedding   vector(1536),  -- SAP AI Core text-embedding-ada-002 or equivalent
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Project Risks (computed by Risk Radar — BE-5)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_risks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category        TEXT NOT NULL,  -- overdue_task | unresolved_conflict | deadline_approaching | unassigned_critical | other
    title           TEXT NOT NULL,
    description     TEXT,
    severity        TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
    entity_type     TEXT,  -- task | conflict | decision
    entity_id       UUID,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'
);

-- ─────────────────────────────────────────────
-- Copilot Conversations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS copilot_conversations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    title       TEXT,  -- auto-generated from first message
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS copilot_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id     UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
    role                TEXT NOT NULL,  -- user | assistant
    content             TEXT NOT NULL,
    sources             JSONB DEFAULT '[]',  -- [{meeting_title, speaker, quote}]
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes (for common query patterns)
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meetings_project_id ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project_id ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_meeting_id ON decisions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_project_id ON conflicts(project_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);
CREATE INDEX IF NOT EXISTS idx_project_state_project_id ON project_state(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_project_id ON transcript_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_meeting_id ON transcript_chunks(meeting_id);

-- pgvector cosine similarity index (for copilot semantic search)
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding
    ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─────────────────────────────────────────────
-- updated_at auto-update trigger
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['users','projects','meetings','decisions','tasks','conflicts','project_state','copilot_conversations'] LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at ON %I;
            CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', tbl, tbl);
    END LOOP;
END;
$$;
