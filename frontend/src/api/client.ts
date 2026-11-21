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
  return apiFetch<DashboardStats>('/api/dashboard')
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<ListResponse<Project>> {
  return apiFetch<ListResponse<Project>>('/api/projects')
}

export async function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`)
}

export async function createProject(body: CreateProjectRequest): Promise<Project> {
  return apiFetch<Project>('/api/projects', { method: 'POST', body: JSON.stringify(body) })
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function getMembers(projectId: string): Promise<ListResponse<Member>> {
  return apiFetch<ListResponse<Member>>(`/api/projects/${projectId}/members`)
}

export async function addMember(projectId: string, body: AddMemberRequest): Promise<Member> {
  return apiFetch<Member>(`/api/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(body) })
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function getMeetings(projectId: string): Promise<ListResponse<Meeting>> {
  return apiFetch<ListResponse<Meeting>>(`/api/projects/${projectId}/meetings`)
}

export async function getMeeting(meetingId: string): Promise<Meeting> {
  return apiFetch<Meeting>(`/api/meetings/${meetingId}`)
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
  return apiFetch<ListResponse<Decision>>(`/api/projects/${projectId}/decisions`)
}

// ── Conflicts ─────────────────────────────────────────────────────────────────

export async function getConflicts(projectId: string): Promise<ListResponse<Conflict>> {
  return apiFetch<ListResponse<Conflict>>(`/api/projects/${projectId}/conflicts`)
}

export async function resolveConflict(conflictId: string, body: ResolveConflictRequest): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/conflicts/${conflictId}/resolve`, { method: 'POST', body: JSON.stringify(body) })
}

export async function rejectConflict(conflictId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/conflicts/${conflictId}/reject`, { method: 'POST' })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function getTasks(projectId: string): Promise<ListResponse<Task>> {
  return apiFetch<ListResponse<Task>>(`/api/projects/${projectId}/tasks`)
}

export async function createTask(projectId: string, body: CreateTaskRequest): Promise<Task> {
  return apiFetch<Task>(`/api/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateTask(taskId: string, body: UpdateTaskRequest): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) })
}

// ── Project State & Risks ─────────────────────────────────────────────────────

export async function getProjectState(projectId: string): Promise<ListResponse<ProjectState>> {
  return apiFetch<ListResponse<ProjectState>>(`/api/projects/${projectId}/state`)
}

export async function getRisks(projectId: string): Promise<ListResponse<Risk>> {
  return apiFetch<ListResponse<Risk>>(`/api/projects/${projectId}/risks`)
}

export async function getConversations(): Promise<ListResponse<Conversation>> {
  return apiFetch<ListResponse<Conversation>>('/api/copilot/conversations')
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

