# NEXORA — Task Distribution

**Hackathon Team:** Preetam (you) + Saikat  
**Branch Strategy:** Saikat opens PRs → Preetam reviews and merges  
**Goal:** Parallel development with zero blocking dependencies

---

## PREETAM's Tasks — Agentic Layer + Backend Intelligence

> Heavy AI/orchestration work. Backend infrastructure, LangGraph agents, all LLM logic.

| ID | Task | Status | Branch |
|----|------|--------|--------|
| INFRA-1 | Repo skeleton: monorepo structure, pyproject.toml, .env.example | ✅ Done | `main` |
| INFRA-2 | Supabase schema SQL: all 16 tables (see `backend/db/schema.sql`) | ✅ Done | `main` |
| INFRA-3 | FastAPI app skeleton: main.py, config.py, database.py (asyncpg), CORS, `/health` endpoint | ✅ Done | `main` |
| AI-1 | `AICoreService` — LiteLLM wrapper: `complete()`, `complete_json()`, `complete_stream()`, factory | ✅ Done | `main` |
| AI-2 | LangGraph workflow state schema: `WorkflowState`, `MeetingAnalysis`, `ConflictRecord` (Pydantic models) | ✅ Done | `main` |
| AI-3 | **Meeting Analyst Agent** — single mega-extraction LLM call → summary + decisions + tasks + owners + deadlines + evidence (structured JSON) | ✅ Done | `feature/ai-agents` |
| AI-4 | **Memory Agent** — SQL retrieval of historical decisions, tasks, assignments, project state for a project | ✅ Done | `feature/ai-agents` |
| AI-5 | **Conflict Analyst Agent** — LLM comparison of new vs historical, classify conflict type + severity + evidence | ✅ Done | `feature/ai-agents` |
| AI-6 | **Recommendation Agent** — folded into AI-5 (same LLM call, no extra round-trip) | ✅ Done | `feature/ai-agents` |
| AI-7 | **Impact Analysis Agent** — find affected tasks/members/deadlines from DB for a proposed change | ✅ Done | `feature/ai-agents` |
| AI-8 | **LangGraph Orchestrator** — wire all nodes, `asyncio.gather()` for parallel steps, approval gate node | ✅ Done | `feature/ai-agents` |
| AI-9 | **Execution Agent** — write approved changes to DB (decisions, tasks, project_state, activity_log) | ✅ Done | `feature/ai-agents` |
| AI-10 | **Copilot Agent** — hybrid retrieval (SQL + semantic/pgvector), stream response via SSE | ✅ Done | `feature/ai-agents` |
| BE-1 | Meeting API routes: `POST /api/meetings/{id}/analyze`, `GET /api/meetings/{id}/analysis` (SSE stream) | ✅ Done | `feature/ai-agents` |
| BE-2 | Conflict resolution API: `POST /api/conflicts/{id}/resolve`, `POST /api/conflicts/{id}/reject` | ✅ Done | `feature/ai-agents` |
| BE-3 | Copilot chat API: `POST /api/copilot/chat` (SSE streaming response) | ✅ Done | `feature/ai-agents` |
| BE-4 | Supabase pgvector setup + transcript chunk embedding pipeline | ⬜ Todo | `feature/be-embeddings` |
| BE-5 | Risk Radar route: `GET /api/projects/{id}/risks` — deterministic rules-based detection | ⬜ Todo | `feature/be-risks` |
| DEPLOY-BE | Railway backend deployment: Procfile, railway.toml, env vars, smoke test on live URL | ⬜ Todo | `feature/be-deploy` |

---

## SAIKAT's Tasks — Frontend + Backend

> UI work + non-AI FastAPI CRUD routes. Open a PR for each task against `main`.

| ID | Task | Status | Branch |
|----|------|--------|--------|
| FE-1 | **Frontend scaffold**: Vite + React + TS + Tailwind + shadcn/ui, React Router, `src/api/client.ts`, `src/types/api.ts` | ⬜ Todo | `feature/ui-scaffold` |
| FE-2 | **Organization Dashboard** — stats cards (Active Projects, Meetings Analyzed, Pending Tasks, Open Conflicts), project list cards with health badge, AI Attention Center, Recent Activity feed | ⬜ Todo | `feature/ui-dashboard` |
| FE-3 | **Project Workspace** — project header + 6-tab layout (Overview, Meetings, Decisions, Tasks, Members, AI Insights) + left meeting history panel | ⬜ Todo | `feature/ui-workspace` |
| FE-4 | **Meeting Upload** — file/paste textarea, metadata form (title, type, date, participants), Analyze button, SSE progress bar | ⬜ Todo | `feature/ui-meeting-upload` |
| FE-5 | **Meeting Analysis Results** — extracted decisions list, tasks list, detected conflicts, recommendations, Approve/Reject per item | ⬜ Todo | `feature/ui-analysis-results` |
| FE-6 | **AI Intelligence Center** — conflict list with severity badges, conflict detail panel (old evidence vs new, AI explanation, resolution options + Approve/Reject) | ⬜ Todo | `feature/ui-intelligence` |
| FE-7 | **Task Management tab** — task table, create task modal, inline status update dropdown | ⬜ Todo | `feature/ui-tasks` |
| FE-8 | **Project AI Copilot** — chat bubble UI, SSE streaming token-by-token, evidence citations panel, suggested question chips | ⬜ Todo | `feature/ui-copilot` |
| BE-CRUD-1 | FastAPI route: Projects CRUD — `POST/GET/PATCH /api/projects` | ⬜ Todo | `feature/be-projects` |
| BE-CRUD-2 | FastAPI route: Members — `GET/POST /api/projects/{id}/members` | ⬜ Todo | `feature/be-members` |
| BE-CRUD-3 | FastAPI route: Tasks CRUD — `GET/POST/PATCH /api/tasks`, `GET /api/projects/{id}/tasks` | ⬜ Todo | `feature/be-tasks` |
| BE-CRUD-4 | FastAPI route: Dashboard aggregation — `GET /api/dashboard` (SQL count queries only, no LLM) | ⬜ Todo | `feature/be-dashboard` |
| BE-CRUD-5 | FastAPI route: Decisions — `GET /api/projects/{id}/decisions`, `GET /api/decisions/{id}` | ⬜ Todo | `feature/be-decisions` |
| SEED | Seed data SQL — Project Alpha + 6 members + 3 meetings (Mon/Wed/Fri transcripts). Load into Supabase. Verify UI shows real data. | ⬜ Todo | `feature/seed-data` |
| DEPLOY-FE | Vercel frontend deployment: `.env.production` (VITE_API_BASE_URL=Railway URL), `vercel.json` | ⬜ Todo | `feature/fe-deploy` |

---

## Integration Tasks (Both)

| ID | Task | Owner |
|----|------|-------|
| INT-1 | Run full 3-meeting workflow end-to-end after all PRs merged | Preetam leads, Saikat verifies UI |
| INT-2 | Fix integration bugs from merged PRs | Preetam |
| INT-3 | Demo script: 3-meeting walkthrough + 4 Copilot questions | Both |

---

## Dependency Order

```
INFRA-1,2,3 (Preetam)
    ↓
AI-1 → AI-2 → AI-3 → AI-4 → AI-5 → AI-6 → AI-7
                                              ↓
                                           AI-8 (Orchestrator)
                                              ↓
                              AI-9 (Execution)  AI-10 (Copilot)
                                              ↓
                                    BE-1, BE-2, BE-3

FE-1 (Saikat, can start in parallel with INFRA)
    ↓
FE-2, FE-3 (use mock data from client.ts stubs)
    ↓
FE-4, FE-5, FE-6, FE-7, FE-8 (wire to real API as backend routes land)

BE-CRUD-1..5 (Saikat, once INFRA-3 is merged)
```

---

## Status Legend
- ⬜ Todo
- 🔄 In Progress  
- ✅ Done
- 🔗 PR Open
- ❌ Blocked
