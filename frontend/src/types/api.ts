// TypeScript types — must stay in sync with backend Pydantic schemas (backend/app/schemas/schemas.py)
// Owner: shared — coordinate changes with Preetam before editing

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'member'
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'on_hold' | 'archived'
  health: 'healthy' | 'at_risk' | 'critical'
  completion_percentage: number
  requirements: string | null
  technology_stack: string[]
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  project_id: string
  user_id: string | null
  name: string
  email: string | null
  role: 'pm' | 'developer' | 'designer' | 'qa' | 'devops' | 'other'
  avatar_url: string | null
  joined_at: string
}

export interface Meeting {
  id: string
  project_id: string
  title: string
  meeting_type: 'sprint_planning' | 'standup' | 'retrospective' | 'technical_review' | 'general'
  meeting_date: string | null
  duration_mins: number | null
  transcript: string | null
  summary: string | null
  main_topics: string[]
  participants: string[]
  status: 'pending' | 'analyzing' | 'analyzed' | 'failed'
  workflow_id: string | null
  created_at: string
  updated_at: string
}

export interface EvidenceItem {
  speaker: string
  quote: string
  timestamp_ref: string | null
}

export interface Decision {
  id: string
  project_id: string
  meeting_id: string | null
  title: string
  description: string | null
  category: 'technical' | 'architecture' | 'business' | 'timeline' | 'operational' | 'other'
  status: 'proposed' | 'approved' | 'rejected' | 'superseded'
  evidence: EvidenceItem[]
  confidence: number
  created_at: string
  updated_at: string
}

export interface ConflictRecommendation {
  action: string
  reason: string
  alternatives: string[]
  pros: string[]
  cons: string[]
  confidence: number
}

export interface Conflict {
  id: string
  project_id: string
  meeting_id: string | null
  category: 'responsibility' | 'technical_decision' | 'deadline' | 'scope' | 'resource' | 'other'
  title: string
  previous_state: { description: string; meeting: string; meeting_date?: string }
  new_state: { description: string; meeting: string; meeting_date?: string }
  evidence: Array<{ source: 'historical' | 'new'; speaker: string; quote: string }>
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  ai_explanation: string | null
  recommendation: ConflictRecommendation | null
  status: 'open' | 'resolved' | 'rejected' | 'ignored'
  resolution_note: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  meeting_id: string | null
  title: string
  description: string | null
  assigned_to_name: string | null
  assigned_to_id: string | null
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'proposed' | 'todo' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Risk {
  id: string
  project_id: string
  category: string
  title: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  entity_type: string | null
  entity_id: string | null
  is_active: boolean
  detected_at: string
}

export interface AttentionItem {
  type: 'conflict' | 'risk' | 'deadline'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  project_id: string
  project_name: string
  entity_id: string
}

export interface ActivityItem {
  id: string
  project_id: string
  actor_name: string | null
  action: string
  summary: string | null
  entity_type: string | null
  created_at: string
}

export interface DashboardStats {
  active_projects: number
  meetings_analyzed: number
  pending_tasks: number
  open_conflicts: number
  projects: Project[]
  attention_items: AttentionItem[]
  recent_activity: ActivityItem[]
}

export interface ProjectState {
  id: string
  state_key: string
  state_value: string
  state_category: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources: Array<{ meeting_title: string; speaker: string; quote: string }>
  created_at: string
}

export interface Conversation {
  id: string
  project_id: string | null
  title: string | null
  created_at: string
  updated_at: string
  messages?: ConversationMessage[]
}

// ── List wrapper (all list endpoints return this shape) ──────────────────────
export interface ListResponse<T> {
  data: T[]
  total: number
}

// ── SSE Event types ──────────────────────────────────────────────────────────
export type SSEEventType = 'progress' | 'result' | 'token' | 'done' | 'error'

export interface SSEProgressPayload {
  step: string
  message: string
  percentage: number
}

export interface SSEResultPayload {
  analysis: {
    summary: string
    decisions: Array<Partial<Decision>>
    tasks: Array<Partial<Task>>
    conflicts: Conflict[]
  }
}

export interface SSEEvent {
  type: SSEEventType
  payload: SSEProgressPayload | SSEResultPayload | { text: string } | { error: string } | { sources: ConversationMessage['sources'] }
}

// ── Request types ────────────────────────────────────────────────────────────
export interface CreateProjectRequest {
  name: string
  description?: string
  requirements?: string
  technology_stack?: string[]
}

export interface CreateMeetingRequest {
  title: string
  meeting_type?: Meeting['meeting_type']
  meeting_date?: string
  transcript?: string
  participants?: string[]
}

export interface CreateTaskRequest {
  title: string
  description?: string
  assigned_to_name?: string
  assigned_to_id?: string
  priority?: Task['priority']
  due_date?: string
}

export interface UpdateTaskRequest {
  status?: Task['status']
  assigned_to_name?: string
  assigned_to_id?: string
  priority?: Task['priority']
  due_date?: string
}

export interface AddMemberRequest {
  name: string
  email?: string
  role?: Member['role']
}

export interface ResolveConflictRequest {
  resolution: string
  approved_by?: string
}

export interface CopilotChatRequest {
  project_id?: string
  message: string
  conversation_id?: string
}
