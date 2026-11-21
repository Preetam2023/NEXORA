# NEXORA — Claude Working Guide

> Read this fully before starting any task. It tells you who you're working with, what the project is, what your scope is, and how to work without breaking the other person's work.

---

## Who You Are Working With

**Two engineers. One codebase. Parallel work.**

### Preetam
- Role: Backend + Agentic AI layer
- Owns: `backend/app/agents/`, `backend/app/ai/`, all LangGraph nodes, all LLM logic, Railway deployment
- Branch pattern: `feature/ai-*`, `feature/be-*`
- Merges all PRs into `main`

### Saikat
- Role: Frontend UI + basic CRUD backend routes
- Owns: `frontend/src/pages/`, `frontend/src/components/`, CRUD FastAPI routes, seed data, Vercel deployment
- Branch pattern: `feature/ui-*`, `feature/be-crud-*`
- Opens PRs → Preetam reviews and merges

**When someone says "I am Saikat" at the start of a conversation, follow the Saikat scope section below.**  
**When someone says "I am Preetam", follow the Preetam scope section.**  
**If neither is stated, ask: "Are you Preetam or Saikat?"**

---

## What Is NEXORA

An **agentic project intelligence platform** for hackathon teams.

Core loop: User uploads a meeting transcript → AI agents extract decisions, tasks, owners, deadlines → agents compare with historical project memory → conflicts detected (e.g. DB tech changed from MongoDB to PostgreSQL) → evidence-backed recommendations shown → human approves → project state updated → Copilot answers questions like "who handles the DB now?"

The differentiator is **cross-meeting memory**: NEXORA remembers what was decided in Meeting 1 and detects when Meeting 2 contradicts it.

Full spec: [prd.md](prd.md)  
Task assignments: [TASKS.md](TASKS.md)  
API contracts + design rules: [RULES.md](RULES.md)

---

## Project Structure

```
nexora/
├── backend/
│   ├── app/
│   │   ├── main.py                    ← FastAPI app + lifespan
│   │   ├── core/config.py             ← All env vars (pydantic-settings)
│   │   ├── core/database.py           ← Async SQLAlchemy + Supabase
│   │   ├── ai/aicore_service.py       ← LiteLLM wrapper (ONLY LLM entry point)
│   │   ├── ai/factory.py              ← get_ai_service(), get_fast_ai_service()
│   │   ├── agents/state.py            ← WorkflowState + all Pydantic output schemas
│   │   ├── agents/orchestrator.py     ← LangGraph graph
│   │   ├── agents/meeting_analyst.py
│   │   ├── agents/memory_agent.py
│   │   ├── agents/conflict_analyst.py
│   │   ├── agents/recommendation.py
│   │   ├── agents/impact_analysis.py
│   │   ├── agents/execution.py
│   │   ├── agents/copilot.py
│   │   ├── api/routes/projects.py
│   │   ├── api/routes/meetings.py
│   │   ├── api/routes/decisions.py
│   │   ├── api/routes/conflicts.py
│   │   ├── api/routes/tasks.py
│   │   ├── api/routes/copilot.py
│   │   └── api/routes/dashboard.py
│   ├── models/models.py               ← SQLAlchemy ORM models
│   ├── schemas/                       ← Pydantic request/response schemas
│   ├── db/schema.sql                  ← Supabase DDL (all 16 tables)
│   ├── db/seed.sql                    ← Project Alpha demo data
│   ├── requirements.txt
│   ├── Procfile                       ← Railway: web: uvicorn app.main:app ...
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.ts              ← ALL API calls go here — never raw fetch in components
    │   ├── types/api.ts               ← TypeScript types (must match backend Pydantic schemas)
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── ProjectWorkspace.tsx
    │   │   ├── IntelligenceCenter.tsx
    │   │   └── Copilot.tsx
    │   └── components/
    ├── package.json
    └── .env.example
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Query, React Router |
| Backend | Python 3.11+, FastAPI, async SQLAlchemy |
| AI Orchestration | LangGraph (graph-based workflow) |
| LLM | SAP AI Core via LiteLLM (`sap/anthropic--claude-4.5-haiku` for speed) |
| Database | Supabase — PostgreSQL + pgvector |
| Backend Deploy | Railway |
| Frontend Deploy | Vercel |

---

## If You Are Saikat — Read This

### Your Identity in This Project
You are **Saikat**. You work on the **frontend** and **non-AI backend CRUD routes**.  
You never touch: `backend/app/agents/`, `backend/app/ai/`  
You open PRs. Preetam merges them.

### Your Task List (from [TASKS.md](TASKS.md))

Work through these **in order**. Do not jump ahead unless a task is blocked.

| Task ID | What to build | Key files |
|---------|--------------|-----------|
| **FE-1** | Frontend scaffold — Vite + React + TS + Tailwind + shadcn/ui setup | `frontend/package.json`, `frontend/src/api/client.ts`, `frontend/src/types/api.ts` |
| **FE-2** | Organization Dashboard page | `frontend/src/pages/Dashboard.tsx` |
| **FE-3** | Project Workspace page (6 tabs) | `frontend/src/pages/ProjectWorkspace.tsx` |
| **FE-4** | Meeting Upload component + SSE progress bar | `frontend/src/components/MeetingUpload.tsx` |
| **FE-5** | Meeting Analysis Results view (Approve/Reject) | `frontend/src/components/AnalysisResults.tsx` |
| **FE-6** | AI Intelligence Center (conflict detail panel) | `frontend/src/pages/IntelligenceCenter.tsx` |
| **FE-7** | Task Management tab | `frontend/src/components/TasksTab.tsx` |
| **FE-8** | Project AI Copilot page | `frontend/src/pages/Copilot.tsx` |
| **BE-CRUD-1** | FastAPI Projects CRUD routes | `backend/app/api/routes/projects.py` |
| **BE-CRUD-2** | FastAPI Members routes | `backend/app/api/routes/members.py` (or inside projects.py) |
| **BE-CRUD-3** | FastAPI Tasks CRUD routes | `backend/app/api/routes/tasks.py` |
| **BE-CRUD-4** | FastAPI Dashboard aggregation route | `backend/app/api/routes/dashboard.py` |
| **BE-CRUD-5** | FastAPI Decisions read routes | `backend/app/api/routes/decisions.py` |
| **SEED** | Seed data SQL for Project Alpha + 3 meetings | `backend/db/seed.sql` |
| **DEPLOY-FE** | Vercel deployment config | `frontend/vercel.json`, `frontend/.env.production` |

### How to Tell Claude Which Task You're Doing

At the start of each session say:  
**"I am Saikat. Working on [TASK-ID]: [task name]."**

Example: *"I am Saikat. Working on FE-2: Organization Dashboard."*

Claude will then focus only on that task's scope, files, and design rules.

### Design Rules — Non-Negotiable

These come from [RULES.md](RULES.md) §8. Summary:

**Colors (use only these):**
- Navy `#0F172A` — sidebar, primary headings
- Blue `#3B82F6` — buttons, links, accents
- Emerald `#10B981` — success, completed status
- Amber `#F59E0B` — warning, medium severity, proposed/pending
- Red `#EF4444` — error, critical severity, conflict
- Background `#F8FAFC` — page background
- Card `#FFFFFF` with `#E2E8F0` border

**Never do:**
- Purple gradients or any gradient backgrounds on content areas
- Glowing rings, animated blobs, glassmorphism effects
- Emoji in navigation labels or status badges (use Lucide icons)
- Oversized hero sections
- Inline `any` TypeScript types
- Raw `fetch()` in component files — always use `src/api/client.ts`

**Always do:**
- Sidebar: fixed 240px, navy background (`#0F172A`), white text
- Cards: white bg, `border border-slate-200 rounded-lg shadow-sm`
- AI-proposed items: dashed border + amber left accent bar
- Approved/confirmed items: solid border + green left accent bar
- Conflict severity pills: `low`=slate, `medium`=amber, `high`=orange, `critical`=red
- Skeleton loaders (not spinners) while data loads
- Inter font

### API Calls — How to Write Them

All API functions live in `frontend/src/api/client.ts`. Use the base URL from env:

```typescript
// frontend/src/api/client.ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function getProjects() {
  const res = await fetch(`${BASE}/api/projects`)
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ data: Project[]; total: number }>
}
```

For SSE (meeting analysis + copilot):
```typescript
export function streamMeetingAnalysis(meetingId: string, onEvent: (e: SSEEvent) => void) {
  const es = new EventSource(`${BASE}/api/meetings/${meetingId}/analysis`)
  es.onmessage = (e) => onEvent(JSON.parse(e.data))
  es.onerror = () => es.close()
  return () => es.close() // cleanup fn
}
```

### Backend CRUD Routes — How to Write Them

When writing FastAPI CRUD routes, follow this exact pattern. Import the session from `app.core.database`, use Pydantic schemas from `app.schemas.*`, never import from `app.agents.*` or `app.ai.*`.

```python
# backend/app/api/routes/projects.py
from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.projects import ProjectCreate, ProjectResponse
from app.models.models import Project

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project
```

Return shape for lists: always `{"data": [...], "total": n}`

### When Backend Isn't Ready Yet

FE-1 through FE-8 can be built with mock data. In `client.ts`, stub the functions to return hardcoded data that matches the TypeScript types in `api.ts`. When the real backend routes land (Preetam merges them), replace the stubs with real `fetch()` calls. No changes needed in components.

---

## If You Are Preetam — Read This

### Your Task List (from [TASKS.md](TASKS.md))

| Task ID | What to build | Key files |
|---------|--------------|-----------|
| **INFRA-1,2,3** | Repo skeleton + Supabase schema SQL + FastAPI skeleton | `backend/app/main.py`, `backend/app/core/`, `backend/db/schema.sql` |
| **AI-1** | AICoreService (LiteLLM wrapper) | `backend/app/ai/aicore_service.py`, `backend/app/ai/factory.py` |
| **AI-2** | LangGraph state schema | `backend/app/agents/state.py` |
| **AI-3** | Meeting Analyst node | `backend/app/agents/meeting_analyst.py` |
| **AI-4** | Memory Agent node | `backend/app/agents/memory_agent.py` |
| **AI-5** | Conflict Analyst node | `backend/app/agents/conflict_analyst.py` |
| **AI-6** | Recommendation Agent node | `backend/app/agents/recommendation.py` |
| **AI-7** | Impact Analysis node | `backend/app/agents/impact_analysis.py` |
| **AI-8** | LangGraph Orchestrator | `backend/app/agents/orchestrator.py` |
| **AI-9** | Execution Agent | `backend/app/agents/execution.py` |
| **AI-10** | Copilot Agent | `backend/app/agents/copilot.py` |
| **BE-1** | Meeting analyze API (SSE) | `backend/app/api/routes/meetings.py` |
| **BE-2** | Conflict resolve/reject API | `backend/app/api/routes/conflicts.py` |
| **BE-3** | Copilot chat API (SSE) | `backend/app/api/routes/copilot.py` |
| **BE-4** | pgvector embedding pipeline | `backend/app/agents/memory_agent.py` |
| **BE-5** | Risk Radar route | `backend/app/api/routes/risks.py` |
| **DEPLOY-BE** | Railway config | `Procfile`, `railway.toml` |

### SAP AI Core Setup

LiteLLM has a native SAP provider. Set these env vars — LiteLLM picks them up automatically:

```
AICORE_CLIENT_ID=
AICORE_CLIENT_SECRET=
AICORE_AUTH_URL=       # e.g. https://...authentication.sap.hana.ondemand.com
AICORE_BASE_URL=       # e.g. https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com
AICORE_RESOURCE_GROUP=default
```

Model strings: `sap/anthropic--claude-4.5-haiku` (fast, use for all agents) or `sap/anthropic--claude-4.7-opus` (deep reasoning only if needed).

**Critical**: set `litellm.drop_params = True` at app startup — Claude on AI Core rejects the `temperature` param.

Reference implementation: [Legal AI backend](../Legal AI/backend/app/ai/aicore_service.py) — copy this pattern.

### LangGraph Node Pattern

Each node is a plain function that takes `WorkflowState` and returns a partial dict:

```python
# backend/app/agents/meeting_analyst.py
from app.agents.state import WorkflowState
from app.ai.factory import get_ai_service

def run_meeting_analyst(state: WorkflowState) -> dict:
    ai = get_ai_service()
    result = ai.complete_json(
        system=SYSTEM_PROMPT,
        user=build_prompt(state.transcript, state.project_context),
    )
    return {"meeting_analysis": MeetingAnalysis(**result)}
```

Wire nodes in `orchestrator.py`. Use `asyncio.gather()` for independent parallel steps (Memory retrieval + Meeting Analyst can run in parallel; Conflict Analyst needs both results first).

### Speed Target: 12–15 Seconds Total

- **1 LLM call** in Meeting Analyst — extract everything (summary + decisions + tasks + owners + deadlines + evidence) in one structured JSON call. No chained calls.
- Memory retrieval is SQL — fast, no LLM.
- Conflict Analyst: 1 LLM call with historical context injected.
- Recommendation: same call as conflict or immediately after.
- Stream SSE progress events so user sees "Analyzing…" within 1 second of clicking Analyze.

---

## Running Locally

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in AICORE_* and DATABASE_URL
uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
# Health: http://localhost:8000/health
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000
npm run dev
# App: http://localhost:5173
```

### Database (Supabase)
1. Create a Supabase project
2. Run `backend/db/schema.sql` in the Supabase SQL editor
3. Run `backend/db/seed.sql` to load Project Alpha demo data
4. Copy the connection string into `DATABASE_URL` in `backend/.env`

---

## Demo Scenario — Project Alpha

This is the scenario judges will see. It must work perfectly on the deployed app.

**Project**: Backend Modernization  
**Members**: Rahul (PM), Arjun (Backend Dev), Sanchita (DB Engineer), Priya (API Dev), Neha (QA), Aman (Frontend)

**Meeting 1 — Monday Sprint Planning**  
→ MongoDB chosen as DB, Arjun assigned DB setup, Priya assigned API integration (deadline: Friday)

**Meeting 2 — Wednesday Technical Review**  
→ PostgreSQL proposed as replacement, Sanchita takes over DB implementation  
→ NEXORA detects: Conflict 1 (MongoDB vs PostgreSQL), Conflict 2 (Arjun vs Sanchita ownership)

**Meeting 3 — Friday Sprint Review**  
→ PostgreSQL formally approved, Sanchita confirmed as owner, API deadline extended to Monday

**Copilot answers after all 3 meetings:**
1. "Who is currently handling database implementation?" → Sanchita (Friday evidence)
2. "Why did we move from MongoDB to PostgreSQL?" → relational + transaction requirements
3. "What changed in Project Alpha this week?" → DB tech, ownership, API deadline
4. "What are the remaining risks?" → incomplete API, migration validation

---

## Key Rules (Quick Reference)

1. **Never call LLM directly** — always through `AICoreService` in `backend/app/ai/aicore_service.py`
2. **Never raw fetch in components** — always through `frontend/src/api/client.ts`
3. **AI output = proposal until approved** — status stays `"proposed"` in DB until human approves
4. **Never delete historical records** — decisions, conflicts, old assignments are immutable history
5. **List endpoints return** `{ data: [...], total: number }` — always this shape
6. **SSE events** use `{ type: "progress"|"result"|"token"|"done"|"error", payload: {...} }`
7. **No purple gradients** in the UI — see [RULES.md §8](RULES.md) for exact design rules

Full API contract: [RULES.md §2](RULES.md)
