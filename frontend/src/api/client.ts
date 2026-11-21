// All API calls live here. Never use raw fetch() in component files.
// Owner: shared — coordinate with Preetam before adding endpoints.
// Mock stubs return hardcoded data while backend is not ready.
// Replace each stub's return statement with real fetch once the endpoint is live.

import type {
  Project, Member, Meeting, Decision, Conflict, Task, Risk,
  DashboardStats, Conversation, ProjectState, ListResponse,
  CreateProjectRequest, CreateMeetingRequest, CreateTaskRequest,
  UpdateTaskRequest, AddMemberRequest, ResolveConflictRequest,
  CopilotChatRequest, SSEEvent,
} from '@/types/api'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardStats> {
  // TODO: replace with real call when BE-CRUD-4 is done
  // return apiFetch<DashboardStats>('/api/dashboard')
  return MOCK_DASHBOARD
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<ListResponse<Project>> {
  // TODO: replace with real call when BE-CRUD-1 is done
  // return apiFetch<ListResponse<Project>>('/api/projects')
  return { data: MOCK_PROJECTS, total: MOCK_PROJECTS.length }
}

export async function getProject(id: string): Promise<Project> {
  // TODO: return apiFetch<Project>(`/api/projects/${id}`)
  return MOCK_PROJECTS.find(p => p.id === id) ?? MOCK_PROJECTS[0]
}

export async function createProject(body: CreateProjectRequest): Promise<Project> {
  return apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(body) })
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function getMembers(projectId: string): Promise<ListResponse<Member>> {
  // TODO: return apiFetch<ListResponse<Member>>(`/api/projects/${projectId}/members`)
  return { data: MOCK_MEMBERS, total: MOCK_MEMBERS.length }
}

export async function addMember(projectId: string, body: AddMemberRequest): Promise<Member> {
  return apiFetch<Member>(`/api/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(body) })
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function getMeetings(projectId: string): Promise<ListResponse<Meeting>> {
  // TODO: return apiFetch<ListResponse<Meeting>>(`/api/projects/${projectId}/meetings`)
  return { data: MOCK_MEETINGS, total: MOCK_MEETINGS.length }
}

export async function getMeeting(meetingId: string): Promise<Meeting> {
  // TODO: return apiFetch<Meeting>(`/api/meetings/${meetingId}`)
  return MOCK_MEETINGS.find(m => m.id === meetingId) ?? MOCK_MEETINGS[0]
}

export async function createMeeting(projectId: string, body: CreateMeetingRequest): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/projects/${projectId}/meetings`, { method: 'POST', body: JSON.stringify(body) })
}

export async function triggerAnalysis(meetingId: string): Promise<{ workflow_id: string }> {
  return apiFetch<{ workflow_id: string }>(`/api/meetings/${meetingId}/analyze`, { method: 'POST' })
}

export function streamMeetingAnalysis(meetingId: string, onEvent: (e: SSEEvent) => void): () => void {
  const es = new EventSource(`${BASE}/api/meetings/${meetingId}/analysis`)
  es.onmessage = (e) => {
    try { onEvent(JSON.parse(e.data as string) as SSEEvent) } catch { /* ignore parse errors */ }
  }
  es.onerror = () => es.close()
  return () => es.close()
}

// ── Decisions ─────────────────────────────────────────────────────────────────

export async function getDecisions(projectId: string): Promise<ListResponse<Decision>> {
  // TODO: return apiFetch<ListResponse<Decision>>(`/api/projects/${projectId}/decisions`)
  return { data: MOCK_DECISIONS, total: MOCK_DECISIONS.length }
}

// ── Conflicts ─────────────────────────────────────────────────────────────────

export async function getConflicts(projectId: string): Promise<ListResponse<Conflict>> {
  // TODO: return apiFetch<ListResponse<Conflict>>(`/api/projects/${projectId}/conflicts`)
  return { data: MOCK_CONFLICTS, total: MOCK_CONFLICTS.length }
}

export async function resolveConflict(conflictId: string, body: ResolveConflictRequest): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/conflicts/${conflictId}/resolve`, { method: 'POST', body: JSON.stringify(body) })
}

export async function rejectConflict(conflictId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/conflicts/${conflictId}/reject`, { method: 'POST' })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(projectId: string): Promise<ListResponse<Task>> {
  // TODO: return apiFetch<ListResponse<Task>>(`/api/projects/${projectId}/tasks`)
  return { data: MOCK_TASKS, total: MOCK_TASKS.length }
}

export async function createTask(projectId: string, body: CreateTaskRequest): Promise<Task> {
  return apiFetch<Task>(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateTask(taskId: string, body: UpdateTaskRequest): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

// ── Project State & Risks ─────────────────────────────────────────────────────

export async function getProjectState(projectId: string): Promise<ListResponse<ProjectState>> {
  // TODO: return apiFetch<ListResponse<ProjectState>>(`/api/projects/${projectId}/state`)
  return { data: MOCK_STATE, total: MOCK_STATE.length }
}

export async function getRisks(projectId: string): Promise<ListResponse<Risk>> {
  // TODO: return apiFetch<ListResponse<Risk>>(`/api/projects/${projectId}/risks`)
  return { data: [], total: 0 }
}

// ── Copilot ───────────────────────────────────────────────────────────────────

export async function getConversations(): Promise<ListResponse<Conversation>> {
  // TODO: return apiFetch<ListResponse<Conversation>>('/api/copilot/conversations')
  return { data: [], total: 0 }
}

export function streamCopilotChat(body: CopilotChatRequest, onEvent: (e: SSEEvent) => void): () => void {
  // SSE with POST body — use fetch + ReadableStream
  let closed = false
  const controller = new AbortController()

  void fetch(`${BASE}/api/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (!closed) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try { onEvent(JSON.parse(line.slice(6)) as SSEEvent) } catch { /* ignore */ }
        }
      }
    }
  }).catch(() => { /* stream closed */ })

  return () => { closed = true; controller.abort() }
}

// ═════════════════════════════════════════════════════════════════════════════
// MOCK DATA — replace with real API calls when backend routes are ready
// These match the TypeScript types exactly so component code doesn't change.
// ═════════════════════════════════════════════════════════════════════════════

const MOCK_PROJECTS: Project[] = [
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    name: 'Project Alpha — Backend Modernization',
    description: 'Migrate legacy monolith backend to a modern microservices architecture.',
    status: 'active',
    health: 'at_risk',
    completion_percentage: 35,
    requirements: 'Migrate existing MongoDB-based backend to PostgreSQL. Build RESTful API.',
    technology_stack: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    created_at: '2024-11-18T09:00:00Z',
    updated_at: '2024-11-22T16:00:00Z',
  },
]

const MOCK_MEMBERS: Member[] = [
  { id: 'bbbbbbbb-0000-0000-0000-000000000001', project_id: MOCK_PROJECTS[0].id, user_id: null, name: 'Rahul Sharma',  email: 'rahul@acme.com',    role: 'pm',        avatar_url: null, joined_at: '2024-11-18T09:00:00Z' },
  { id: 'bbbbbbbb-0000-0000-0000-000000000002', project_id: MOCK_PROJECTS[0].id, user_id: null, name: 'Arjun Verma',   email: 'arjun@acme.com',    role: 'developer', avatar_url: null, joined_at: '2024-11-18T09:00:00Z' },
  { id: 'bbbbbbbb-0000-0000-0000-000000000003', project_id: MOCK_PROJECTS[0].id, user_id: null, name: 'Sanchita Rao',  email: 'sanchita@acme.com', role: 'developer', avatar_url: null, joined_at: '2024-11-18T09:00:00Z' },
  { id: 'bbbbbbbb-0000-0000-0000-000000000004', project_id: MOCK_PROJECTS[0].id, user_id: null, name: 'Priya Nair',    email: 'priya@acme.com',    role: 'developer', avatar_url: null, joined_at: '2024-11-18T09:00:00Z' },
  { id: 'bbbbbbbb-0000-0000-0000-000000000005', project_id: MOCK_PROJECTS[0].id, user_id: null, name: 'Neha Joshi',    email: 'neha@acme.com',     role: 'qa',        avatar_url: null, joined_at: '2024-11-18T09:00:00Z' },
  { id: 'bbbbbbbb-0000-0000-0000-000000000006', project_id: MOCK_PROJECTS[0].id, user_id: null, name: 'Aman Singh',    email: 'aman@acme.com',     role: 'developer', avatar_url: null, joined_at: '2024-11-18T09:00:00Z' },
]

const MOCK_MEETINGS: Meeting[] = [
  { id: 'cccccccc-0000-0000-0000-000000000001', project_id: MOCK_PROJECTS[0].id, title: 'Sprint Planning — Week 1',       meeting_type: 'sprint_planning',  meeting_date: '2024-11-18T10:00:00Z', duration_mins: 45, transcript: null, summary: 'MongoDB chosen as database, tasks assigned to Arjun and Priya.', main_topics: ['Database selection', 'Task assignment', 'API deadline'], participants: ['Rahul Sharma', 'Arjun Verma', 'Sanchita Rao', 'Priya Nair', 'Neha Joshi', 'Aman Singh'], status: 'analyzed', workflow_id: null, created_at: '2024-11-18T10:00:00Z', updated_at: '2024-11-18T11:00:00Z' },
  { id: 'cccccccc-0000-0000-0000-000000000002', project_id: MOCK_PROJECTS[0].id, title: 'Technical Architecture Review', meeting_type: 'technical_review', meeting_date: '2024-11-20T14:00:00Z', duration_mins: 60, transcript: null, summary: 'PostgreSQL proposed as replacement for MongoDB. 2 conflicts detected.', main_topics: ['Database migration', 'PostgreSQL benefits', 'Ownership change'], participants: ['Rahul Sharma', 'Arjun Verma', 'Sanchita Rao', 'Priya Nair'], status: 'analyzed', workflow_id: null, created_at: '2024-11-20T14:00:00Z', updated_at: '2024-11-20T15:00:00Z' },
  { id: 'cccccccc-0000-0000-0000-000000000003', project_id: MOCK_PROJECTS[0].id, title: 'Sprint Review & Retrospective',  meeting_type: 'retrospective',    meeting_date: '2024-11-22T16:00:00Z', duration_mins: 50, transcript: null, summary: 'PostgreSQL formally approved. Sanchita confirmed as DB lead. API deadline Monday.', main_topics: ['PostgreSQL confirmation', 'Ownership confirmation', 'Risk review'], participants: ['Rahul Sharma', 'Arjun Verma', 'Sanchita Rao', 'Priya Nair', 'Neha Joshi', 'Aman Singh'], status: 'analyzed', workflow_id: null, created_at: '2024-11-22T16:00:00Z', updated_at: '2024-11-22T17:00:00Z' },
]

const MOCK_DECISIONS: Decision[] = [
  { id: 'dddddddd-0000-0000-0000-000000000001', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[0].id, title: 'MongoDB selected as database (Meeting 1)', description: 'Team agreed to use MongoDB initially.', category: 'technical', status: 'superseded', evidence: [{ speaker: 'Rahul Sharma', quote: 'we are going with MongoDB as our database technology', timestamp_ref: null }], confidence: 0.95, created_at: '2024-11-18T10:30:00Z', updated_at: '2024-11-22T16:00:00Z' },
  { id: 'dddddddd-0000-0000-0000-000000000005', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[2].id, title: 'PostgreSQL formally confirmed as production database', description: 'PostgreSQL approved, supersedes MongoDB decision.', category: 'technical', status: 'approved', evidence: [{ speaker: 'Rahul Sharma', quote: 'PostgreSQL is formally confirmed and approved as our production database', timestamp_ref: null }], confidence: 0.99, created_at: '2024-11-22T16:00:00Z', updated_at: '2024-11-22T16:00:00Z' },
  { id: 'dddddddd-0000-0000-0000-000000000006', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[2].id, title: 'Sanchita confirmed as database implementation owner', description: 'Sanchita Rao takes full ownership of database layer.', category: 'operational', status: 'approved', evidence: [{ speaker: 'Sanchita Rao', quote: 'I am the database implementation owner going forward', timestamp_ref: null }], confidence: 0.99, created_at: '2024-11-22T16:00:00Z', updated_at: '2024-11-22T16:00:00Z' },
]

const MOCK_CONFLICTS: Conflict[] = [
  {
    id: 'ffffffff-0000-0000-0000-000000000001',
    project_id: MOCK_PROJECTS[0].id,
    meeting_id: MOCK_MEETINGS[1].id,
    category: 'technical_decision',
    title: 'Database technology changed: MongoDB → PostgreSQL',
    previous_state: { description: 'MongoDB selected as database technology', meeting: 'Sprint Planning — Week 1', meeting_date: '2024-11-18' },
    new_state: { description: 'PostgreSQL proposed as replacement', meeting: 'Technical Architecture Review', meeting_date: '2024-11-20' },
    evidence: [
      { source: 'historical', speaker: 'Rahul Sharma', quote: 'we are going with MongoDB as our database technology' },
      { source: 'new', speaker: 'Rahul Sharma', quote: 'our decision is: we are moving to PostgreSQL as our database' },
    ],
    severity: 'high',
    confidence: 0.97,
    ai_explanation: 'The team approved MongoDB in Monday\'s sprint planning. Wednesday\'s technical review proposes replacing it with PostgreSQL, citing transaction limitations.',
    recommendation: { action: 'Approve the switch to PostgreSQL and supersede the MongoDB decision', reason: 'Technical team is aligned on PostgreSQL\'s superiority for this use case.', alternatives: ['Keep MongoDB', 'Hybrid approach'], pros: ['ACID transactions', 'Better query performance'], cons: ['2-3 days rework', 'Learning curve'], confidence: 0.92 },
    status: 'resolved',
    resolution_note: 'PostgreSQL formally approved in Meeting 3.',
    resolved_at: '2024-11-22T16:00:00Z',
    created_at: '2024-11-20T14:30:00Z',
    updated_at: '2024-11-22T16:00:00Z',
  },
  {
    id: 'ffffffff-0000-0000-0000-000000000002',
    project_id: MOCK_PROJECTS[0].id,
    meeting_id: MOCK_MEETINGS[1].id,
    category: 'responsibility',
    title: 'Database ownership transferred: Arjun → Sanchita',
    previous_state: { description: 'Arjun Verma assigned as database implementation lead', meeting: 'Sprint Planning — Week 1', meeting_date: '2024-11-18' },
    new_state: { description: 'Sanchita Rao proposed to take over database implementation', meeting: 'Technical Architecture Review', meeting_date: '2024-11-20' },
    evidence: [
      { source: 'historical', speaker: 'Rahul Sharma', quote: 'Arjun, you\'re the database implementation lead, deadline Friday' },
      { source: 'new', speaker: 'Sanchita Rao', quote: 'I can take over the database implementation' },
    ],
    severity: 'medium',
    confidence: 0.95,
    ai_explanation: 'Arjun was assigned as DB lead in Monday\'s meeting. Wednesday proposes transferring this to Sanchita who has PostgreSQL expertise.',
    recommendation: { action: 'Transfer database ownership to Sanchita Rao', reason: 'Better expertise match.', alternatives: ['Shared ownership'], pros: ['Better expertise match', 'Cleaner accountability'], cons: ['Arjun loses visibility'], confidence: 0.88 },
    status: 'resolved',
    resolution_note: 'Sanchita confirmed as DB lead in Meeting 3.',
    resolved_at: '2024-11-22T16:00:00Z',
    created_at: '2024-11-20T14:35:00Z',
    updated_at: '2024-11-22T16:00:00Z',
  },
]

const MOCK_TASKS: Task[] = [
  { id: 'eeeeeeee-0000-0000-0000-000000000001', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[0].id, title: 'Set up PostgreSQL database and schema', description: 'Complete schema design and core tables.', assigned_to_name: 'Sanchita Rao', assigned_to_id: MOCK_MEMBERS[2].id, priority: 'high', status: 'in_progress', due_date: '2024-11-21', completed_at: null, created_at: '2024-11-18T10:30:00Z', updated_at: '2024-11-20T14:00:00Z' },
  { id: 'eeeeeeee-0000-0000-0000-000000000002', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[0].id, title: 'Build user authentication and core API endpoints', description: 'User auth + core data endpoints.', assigned_to_name: 'Priya Nair', assigned_to_id: MOCK_MEMBERS[3].id, priority: 'high', status: 'in_progress', due_date: '2024-11-25', completed_at: null, created_at: '2024-11-18T10:30:00Z', updated_at: '2024-11-20T14:00:00Z' },
  { id: 'eeeeeeee-0000-0000-0000-000000000003', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[0].id, title: 'Write API test suite', description: 'Full test coverage for API endpoints.', assigned_to_name: 'Neha Joshi', assigned_to_id: MOCK_MEMBERS[4].id, priority: 'medium', status: 'todo', due_date: '2024-11-26', completed_at: null, created_at: '2024-11-18T10:30:00Z', updated_at: '2024-11-18T10:30:00Z' },
  { id: 'eeeeeeee-0000-0000-0000-000000000004', project_id: MOCK_PROJECTS[0].id, meeting_id: MOCK_MEETINGS[2].id, title: 'Build dashboard UI components', description: 'Mock data dashboard components ready to wire up.', assigned_to_name: 'Aman Singh', assigned_to_id: MOCK_MEMBERS[5].id, priority: 'medium', status: 'in_progress', due_date: '2024-11-25', completed_at: null, created_at: '2024-11-22T16:00:00Z', updated_at: '2024-11-22T16:00:00Z' },
]

const MOCK_STATE: ProjectState[] = [
  { id: '1', state_key: 'database_technology', state_value: 'PostgreSQL', state_category: 'technical', updated_at: '2024-11-22T16:00:00Z' },
  { id: '2', state_key: 'database_implementation_owner', state_value: 'Sanchita Rao', state_category: 'personnel', updated_at: '2024-11-22T16:00:00Z' },
  { id: '3', state_key: 'api_integration_owner', state_value: 'Priya Nair', state_category: 'personnel', updated_at: '2024-11-18T10:00:00Z' },
  { id: '4', state_key: 'api_deadline', state_value: '2024-11-25', state_category: 'timeline', updated_at: '2024-11-22T16:00:00Z' },
]

const MOCK_DASHBOARD: DashboardStats = {
  active_projects: 1,
  meetings_analyzed: 3,
  pending_tasks: 3,
  open_conflicts: 0,
  projects: MOCK_PROJECTS,
  attention_items: [],
  recent_activity: [
    { id: '1', project_id: MOCK_PROJECTS[0].id, actor_name: 'Rahul Sharma', action: 'meeting_analyzed', summary: 'Sprint Review analyzed — PostgreSQL approved, conflicts resolved', entity_type: 'meeting', created_at: '2024-11-22T16:30:00Z' },
    { id: '2', project_id: MOCK_PROJECTS[0].id, actor_name: 'Rahul Sharma', action: 'conflict_resolved', summary: 'Database technology conflict resolved — PostgreSQL approved', entity_type: 'conflict', created_at: '2024-11-22T16:00:00Z' },
    { id: '3', project_id: MOCK_PROJECTS[0].id, actor_name: 'Rahul Sharma', action: 'meeting_analyzed', summary: 'Technical Review analyzed — 2 conflicts detected', entity_type: 'meeting', created_at: '2024-11-20T15:00:00Z' },
  ],
}
