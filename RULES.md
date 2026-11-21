# NEXORA — Integration Rules & Contract

> **Read this before writing a single line of code.**  
> This document is the source of truth for how Preetam's backend and Saikat's frontend fit together without manual coordination.

---

## 1. Project Structure

```
nexora/
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI app factory + lifespan
│   │   ├── core/
│   │   │   ├── config.py                # pydantic-settings, all env vars
│   │   │   └── database.py              # async SQLAlchemy engine + session
│   │   ├── ai/
│   │   │   ├── aicore_service.py        # LiteLLM wrapper — ONLY LLM entry point
│   │   │   └── factory.py               # get_ai_service(), get_fast_ai_service()
│   │   ├── agents/
│   │   │   ├── state.py                 # WorkflowState + all Pydantic output models
│   │   │   ├── orchestrator.py          # LangGraph graph definition
│   │   │   ├── meeting_analyst.py
│   │   │   ├── memory_agent.py
│   │   │   ├── conflict_analyst.py
│   │   │   ├── recommendation.py
│   │   │   ├── impact_analysis.py
│   │   │   ├── execution.py
│   │   │   └── copilot.py
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── projects.py
│   │   │       ├── meetings.py
│   │   │       ├── decisions.py
│   │   │       ├── conflicts.py
│   │   │       ├── tasks.py
│   │   │       ├── copilot.py
│   │   │       └── dashboard.py
│   │   ├── models/
│   │   │   └── models.py                # SQLAlchemy ORM models
│   │   └── schemas/
│   │       └── *.py                     # Pydantic request/response schemas
│   ├── db/
│   │   ├── schema.sql                   # Full Supabase DDL
│   │   └── seed.sql                     # Project Alpha demo data
│   ├── requirements.txt
│   ├── Procfile                         # web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.ts                # ALL API calls live here — no raw fetch elsewhere
    │   ├── types/
    │   │   └── api.ts                   # TypeScript types mirroring backend schemas
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── ProjectWorkspace.tsx
    │   │   ├── IntelligenceCenter.tsx
    │   │   └── Copilot.tsx
    │   ├── components/
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    └── .env.example
```

**Ownership boundaries — do not cross:**
- Saikat never edits: `backend/app/agents/`, `backend/app/ai/`
- Preetam never edits: `frontend/src/pages/`, `frontend/src/components/`
- Coordinate before touching: `frontend/src/types/api.ts`, `frontend/src/api/client.ts`

---

## 2. Complete API Contract

Saikat builds the frontend against these endpoints exactly. Preetam implements them exactly.  
No endpoint names or shapes change without updating this file first.

### Base URL
- Local: `http://localhost:8000`
- Production: set via `VITE_API_BASE_URL` env var

### Dashboard
```
GET  /api/dashboard
→ DashboardStats {
    active_projects: number
    meetings_analyzed: number
    pending_tasks: number
    open_conflicts: number
    overdue_tasks: number
    completed_tasks: number
    recent_activity: ActivityItem[]
    attention_items: AttentionItem[]
  }
```

### Projects
```
POST   /api/projects          body: CreateProjectRequest   → Project
GET    /api/projects                                        → { data: Project[], total: number }
GET    /api/projects/{id}                                   → Project
PATCH  /api/projects/{id}     body: UpdateProjectRequest   → Project
```

### Members
```
GET    /api/projects/{id}/members                           → { data: Member[], total: number }
POST   /api/projects/{id}/members  body: CreateMemberRequest  → Member
```

### Meetings
```
POST   /api/projects/{id}/meetings   body: CreateMeetingRequest  → Meeting
GET    /api/projects/{id}/meetings                               → { data: Meeting[], total: number }
GET    /api/meetings/{id}                                        → Meeting

POST   /api/meetings/{id}/analyze    body: {}                    → { workflow_id: string }
GET    /api/meetings/{id}/analysis                               → SSE stream (see SSE spec below)
```

### Decisions
```
GET    /api/projects/{id}/decisions                         → { data: Decision[], total: number }
GET    /api/decisions/{id}                                  → Decision
```

### Conflicts
```
GET    /api/projects/{id}/conflicts                         → { data: Conflict[], total: number }
GET    /api/conflicts/{id}                                  → Conflict
POST   /api/conflicts/{id}/resolve   body: ResolveRequest   → { ok: true }
POST   /api/conflicts/{id}/reject    body: {}               → { ok: true }
```

### Tasks
```
GET    /api/projects/{id}/tasks                             → { data: Task[], total: number }
POST   /api/projects/{id}/tasks   body: CreateTaskRequest   → Task
PATCH  /api/tasks/{id}            body: UpdateTaskRequest   → Task
```

### Copilot
```
POST   /api/copilot/chat          body: CopilotChatRequest  → SSE stream (see SSE spec below)
GET    /api/copilot/conversations                           → { data: Conversation[], total: number }
```

### Project Intelligence
```
GET    /api/projects/{id}/state                             → { data: ProjectStateItem[], total: number }
GET    /api/projects/{id}/risks                             → { data: Risk[], total: number }
GET    /api/projects/{id}/activity                          → { data: ActivityLog[], total: number }
```

### Health
```
GET    /health                                              → { status: "ok", ai_core: "connected"|"disabled" }
```

---

## 3. Response Shape Rules

**All list endpoints:**
```json
{ "data": [...], "total": 42 }
```

**All error responses:**
```json
{ "error": "short_code", "detail": "Human readable message" }
```

**HTTP status codes:**
- `200` — success
- `201` — created
- `400` — validation error (bad request body)
- `404` — resource not found
- `422` — Pydantic validation failure (FastAPI default)
- `500` — unexpected server error

**Field conventions:**
- All UUIDs: `string` (not UUID object)
- All timestamps: ISO 8601 string e.g. `"2026-11-21T10:30:00Z"`
- All enum values: lowercase snake_case strings

---

## 4. SSE (Server-Sent Events) Specification

Both the meeting analysis endpoint and copilot chat use SSE.

**Format:** Each event is `data: <json>\n\n`

**Meeting analysis SSE event types:**
```json
{ "type": "progress", "payload": { "step": "analyzing", "message": "Extracting decisions...", "percent": 30 } }
{ "type": "progress", "payload": { "step": "conflicts", "message": "Detecting conflicts...", "percent": 60 } }
{ "type": "result",   "payload": { "meeting_id": "...", "summary": "...", "decisions": [], "tasks": [], "conflicts": [], "recommendations": [] } }
{ "type": "error",    "payload": { "message": "Analysis failed: ..." } }
```

**Copilot chat SSE event types:**
```json
{ "type": "token",   "payload": { "text": "Based on" } }
{ "type": "token",   "payload": { "text": " the meeting" } }
{ "type": "done",    "payload": { "sources": [ { "meeting_id": "...", "speaker": "Rahul", "quote": "..." } ] } }
{ "type": "error",   "payload": { "message": "..." } }
```

**Frontend consumption pattern (TypeScript):**
```typescript
const es = new EventSource(`${API_BASE}/api/meetings/${id}/analysis`)
es.onmessage = (e) => {
  const event = JSON.parse(e.data)
  if (event.type === 'progress') setProgress(event.payload.percent)
  if (event.type === 'result')   setResult(event.payload)
  if (event.type === 'done')     es.close()
  if (event.type === 'error')    { setError(event.payload.message); es.close() }
}
```

---

## 5. TypeScript Type Definitions

Saikat defines these in `frontend/src/types/api.ts`.  
They must stay in sync with backend Pydantic schemas.

```typescript
// Core types
export interface Project {
  id: string
  name: string
  description: string
  manager_id: string
  start_date: string
  deadline: string
  status: 'active' | 'on_hold' | 'completed' | 'cancelled'
  health: 'on_track' | 'needs_attention' | 'at_risk' | 'completed'
  completion_percentage: number
  member_count: number
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  project_id: string
  user_id: string
  name: string
  email: string
  role: 'project_manager' | 'scrum_master' | 'developer' | 'designer' | 'tester' | 'other'
  responsibilities: string
  joined_at: string
}

export interface Meeting {
  id: string
  project_id: string
  title: string
  meeting_type: 'daily_scrum' | 'sprint_planning' | 'sprint_review' | 'retrospective' | 'technical_discussion' | 'general'
  meeting_date: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  summary: string | null
  created_at: string
}

export interface Decision {
  id: string
  project_id: string
  meeting_id: string
  title: string
  description: string
  category: 'technical' | 'architecture' | 'business' | 'resource_allocation' | 'timeline' | 'operational' | 'other'
  status: 'proposed' | 'approved' | 'rejected' | 'superseded' | 'under_review'
  evidence: EvidenceItem[]
  confidence: number
  created_at: string
}

export interface Conflict {
  id: string
  project_id: string
  category: 'responsibility' | 'technical_decision' | 'deadline' | 'scope' | 'resource'
  title: string
  previous_state: Record<string, unknown>
  new_state: Record<string, unknown>
  evidence: EvidenceItem[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  recommendation: ConflictRecommendation
  status: 'open' | 'resolved' | 'rejected'
  created_at: string
  resolved_at: string | null
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  assigned_to: string | null
  assigned_name: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  due_date: string | null
  source_meeting_id: string | null
  created_at: string
  updated_at: string
}

export interface EvidenceItem {
  meeting_id: string
  meeting_title: string
  speaker: string
  timestamp_ref: string | null
  quote: string
}

export interface ConflictRecommendation {
  action: string
  reason: string
  alternatives: string[]
  pros: string[]
  cons: string[]
  confidence: number
}

export interface Risk {
  id: string
  project_id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_type: 'overdue_task' | 'approaching_deadline' | 'blocked_task' | 'unresolved_conflict' | 'dependency'
  status: 'open' | 'resolved'
  created_at: string
}

export interface ActivityLog {
  id: string
  project_id: string
  event_type: string
  description: string
  created_at: string
}

export interface DashboardStats {
  active_projects: number
  meetings_analyzed: number
  pending_tasks: number
  open_conflicts: number
  overdue_tasks: number
  completed_tasks: number
  recent_activity: ActivityItem[]
  attention_items: AttentionItem[]
}

export interface ActivityItem {
  id: string
  event_type: string
  description: string
  project_name: string
  created_at: string
}

export interface AttentionItem {
  type: 'conflict' | 'overdue_task' | 'deadline' | 'blocked_task' | 'unresolved_decision'
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  project_id: string
  resource_id: string
  created_at: string
}

// Request types
export interface CreateProjectRequest {
  name: string
  description: string
  manager_id: string
  start_date: string
  deadline: string
  objectives?: string
  technology_stack?: string[]
  requirements?: string
}

export interface CreateMeetingRequest {
  title: string
  meeting_type: Meeting['meeting_type']
  meeting_date: string
  participants: string[]
  transcript: string
}

export interface CreateTaskRequest {
  title: string
  description: string
  assigned_to?: string
  priority: Task['priority']
  due_date?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  assigned_to?: string
  priority?: Task['priority']
  status?: Task['status']
  due_date?: string
}

export interface ResolveRequest {
  resolution: string
  approved_by: string
}

export interface CopilotChatRequest {
  project_id: string | null
  message: string
  conversation_id?: string
}
```

---

## 6. Environment Variables

**backend/.env** (never commit real values):
```
# App
APP_ENV=local
LOG_LEVEL=INFO

# Database (Supabase)
DATABASE_URL=postgresql+asyncpg://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=

# SAP AI Core / GenAI Hub
AICORE_CLIENT_ID=
AICORE_CLIENT_SECRET=
AICORE_AUTH_URL=
AICORE_BASE_URL=
AICORE_RESOURCE_GROUP=default
AICORE_LLM_MODEL=sap/anthropic--claude-4.5-haiku
AICORE_LLM_FAST_MODEL=sap/anthropic--claude-4.5-haiku
AICORE_LLM_MAX_TOKENS=4096
AICORE_LLM_TIMEOUT=60
AI_ENABLED=true
```

**frontend/.env**:
```
VITE_API_BASE_URL=http://localhost:8000
```

**frontend/.env.production**:
```
VITE_API_BASE_URL=https://<railway-app>.railway.app
```

---

## 7. Branch & PR Rules

| Rule | Detail |
|------|--------|
| `main` | Always deployable. Preetam merges all PRs. |
| Saikat's branches | `feature/ui-*` for frontend, `feature/be-crud-*` for CRUD routes |
| Preetam's branches | `feature/ai-*` for agents, `feature/be-*` for AI backend routes |
| PR title format | `[FE-N] Description` or `[AI-N] Description` or `[BE-N] Description` |
| PR scope | Never mix `frontend/` and `backend/` in one PR |
| PR size | Keep PRs small — one task per PR |
| Conflicts | Resolve in Preetam's local branch before merging |

---

## 8. Code Rules

### Python (Backend)
- Python 3.11+, `from __future__ import annotations` in every file
- Pydantic v2 for all schemas
- `async/await` throughout — no blocking IO in async routes
- `litellm.drop_params = True` — set once at app startup in `main.py` (Claude on AI Core rejects `temperature`)
- **All LLM calls go through `AICoreService`** — never call `litellm.completion()` directly in agent nodes
- LangGraph nodes are functions: `(state: WorkflowState) -> dict` (partial state update)
- One `complete_json()` call per agent node — no chained LLM calls within a single node
- Never auto-approve AI output — proposed changes go into DB with `status="proposed"` and wait for human action

### TypeScript (Frontend)
- TypeScript strict mode
- **All API calls go through `src/api/client.ts`** — no raw `fetch()` in components
- All types from `src/types/api.ts` — no inline `any` types
- React Query for all data fetching (caching, loading states, error handling)
- No hardcoded project IDs, user IDs, or demo strings in components — use real API data

### Design Rules (Saikat — read carefully)
- **Color palette** (strict):
  - Primary navy: `#0F172A` (slate-900)
  - Accent blue: `#3B82F6` (blue-500)
  - Success green: `#10B981` (emerald-500)
  - Warning amber: `#F59E0B` (amber-500)
  - Conflict red: `#EF4444` (red-500)
  - Background: `#F8FAFC` (slate-50)
  - Card background: `#FFFFFF`
  - Border: `#E2E8F0` (slate-200)
- **Typography**: Inter font (or system-ui fallback)
- **No purple gradients** — this is an enterprise SaaS, not a marketing page
- **No glowing elements, animated blobs, or hero gradients**
- **No emoji in UI labels** — use Lucide icons only
- **Status badges**: use small rounded pills with colored backgrounds (not text-only)
- Sidebar navigation: fixed width 240px, navy background, white text
- Cards: white background, 1px slate-200 border, 8px border-radius, subtle shadow
- **Clear visual distinction**: AI-proposed items have a dashed border + amber left accent. Approved items have solid border.
- Conflict severity colors: low=slate, medium=amber, high=orange, critical=red
- Loading states: skeleton placeholders, not spinners
- Error states: inline error message, not full-page error

---

## 9. Database: Key Tables Summary

Full DDL in `backend/db/schema.sql`. Key relationships:

```
projects ──< project_members >── users
projects ──< meetings
meetings ──< decisions
meetings ──< tasks (via source_meeting_id)
projects ──< conflicts
conflicts ──< approvals
projects ──< project_state  (key-value: current approved state)
projects ──< activity_logs
meetings ──< transcript_chunks (with pgvector embedding)
```

**Critical rule**: `project_state` table stores the CURRENT approved state (e.g. `{key: "database_technology", value: "postgresql"}`). Historical decisions are in `decisions` table. Never merge them.

---

## 10. Demo Scenario (must work end-to-end)

**Project Alpha — Backend Modernization**  
Members: Rahul (PM), Arjun (Backend Dev), Sanchita (DB Engineer), Priya (API Dev), Neha (QA), Aman (Frontend)

**Meeting 1 — Monday Sprint Planning**  
Key outputs: MongoDB decision, Arjun → DB setup, Priya → API integration (deadline: Friday)

**Meeting 2 — Wednesday Technical Review**  
Key outputs: PostgreSQL proposal, Sanchita → DB implementation, Conflict: MongoDB vs PostgreSQL, Conflict: Arjun vs Sanchita ownership

**Meeting 3 — Friday Sprint Review**  
Key outputs: PostgreSQL approved, Sanchita confirmed as owner, API deadline extended to Monday

**Copilot must answer:**
1. "Who is currently handling database implementation?" → Sanchita (with Friday evidence)
2. "Why did we move from MongoDB to PostgreSQL?" → relational + transaction requirements (Wednesday + Friday evidence)
3. "What changed in Project Alpha this week?" → DB tech, ownership, API deadline
4. "What are the remaining risks?" → incomplete API integration, migration validation

---

## 11. Performance Targets

The judges see results in **12–15 seconds** max. Architecture to achieve this:

| Step | Approach | Target time |
|------|----------|-------------|
| Meeting Analyst | Single LLM call, full extraction | ~5-7s |
| Memory retrieval | SQL queries (no LLM) | ~0.5s |
| Conflict detection | 1 LLM call with historical context injected | ~3-4s |
| Recommendation | Same call or parallel to conflict | ~0s extra |
| DB writes | Async batch insert | ~0.5s |
| **Total** | Sequential where needed, parallel where possible | **~10-12s** |

**Never do**: 4+ sequential LLM calls. Each extra call costs 3-8 seconds.  
**Always do**: Stream progress SSE events so the user sees something within 1 second of clicking Analyze.
