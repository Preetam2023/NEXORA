import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getProject, getMeetings, getDecisions, getMembers, getTasks,
  getRisks, getProjectState, getConflicts, createMeeting, createTask,
  addMember, updateTask, triggerAnalysis,
} from '@/api/client'
import { cn, formatDate, formatDateTime, statusColor, severityColor, healthDot, initials, avatarBg } from '@/lib/utils'
import {
  AlertTriangle, CheckCircle2, Clock, Users, Zap, FileText,
  ListChecks, Brain, Plus, Calendar, Shield, Pencil, X, Check,
} from 'lucide-react'
import type { Task, Member, Project, Meeting } from '@/types/api'

type Tab = 'overview' | 'meetings' | 'decisions' | 'tasks' | 'members' | 'insights'

interface Props {
  onOpenCopilot: (projectId: string) => void
}

export default function ProjectWorkspace({ onOpenCopilot }: Props) {
  const { projectId } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  if (isLoading) return <WorkspaceSkeleton />
  if (!project) return <div className="p-6 text-slate-500">Project not found.</div>

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'decisions', label: 'Decisions' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'members', label: 'Members' },
    { id: 'insights', label: 'AI Insights' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className={cn('w-2.5 h-2.5 rounded-full', healthDot(project.health))} />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{project.name}</h1>
              <span className={cn('text-xs px-2.5 py-1 rounded-md font-semibold', statusColor(project.health))}>
                {project.health.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500 text-sm ml-4 font-medium">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-400">Completion</p>
              <p className="text-lg font-bold text-slate-900 tab-num">{project.completion_percentage}%</p>
            </div>
            <button
              onClick={() => onOpenCopilot(project.id)}
              className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <Zap size={12} />
              Copilot
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${project.completion_percentage}%`,
              background: project.completion_percentage > 70 ? '#10B981' : project.completion_percentage > 40 ? '#3B82F6' : '#F59E0B',
            }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mt-4 -mb-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab project={project} projectId={project.id} />}
          {activeTab === 'meetings' && <MeetingsTab projectId={project.id} />}
          {activeTab === 'decisions' && <DecisionsTab projectId={project.id} />}
          {activeTab === 'tasks' && <TasksFullTab projectId={project.id} />}
          {activeTab === 'members' && <MembersFullTab projectId={project.id} />}
          {activeTab === 'insights' && <InsightsTab projectId={project.id} />}
        </div>
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ project, projectId }: { project: Project; projectId: string }) {
  const { data: tasksData } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => getTasks(projectId) })
  const { data: meetingsData } = useQuery({ queryKey: ['meetings', projectId], queryFn: () => getMeetings(projectId) })
  const { data: conflictsData } = useQuery({ queryKey: ['conflicts', projectId], queryFn: () => getConflicts(projectId) })
  const { data: membersData } = useQuery({ queryKey: ['members', projectId], queryFn: () => getMembers(projectId) })
  const { data: stateData } = useQuery({ queryKey: ['project-state', projectId], queryFn: () => getProjectState(projectId) })

  const tasks = tasksData?.data ?? []
  const meetings = meetingsData?.data ?? []
  const conflicts = conflictsData?.data ?? []
  const members = membersData?.data ?? []
  const state = stateData?.data ?? []

  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const todo = tasks.filter(t => t.status === 'todo' || t.status === 'proposed').length
  const done = tasks.filter(t => t.status === 'completed').length
  const openConflicts = conflicts.filter(c => c.status === 'open').length

  return (
    <div className="max-w-5xl space-y-6 animate-in">
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-4">
        <MiniStat label="Meetings" value={meetings.length} sub={`${meetings.filter(m => m.status === 'analyzed').length} analyzed`} icon={<FileText size={14} className="text-blue-500" />} />
        <MiniStat label="Tasks" value={tasks.length} sub={`${inProgress} in progress`} icon={<ListChecks size={14} className="text-amber-500" />} />
        <MiniStat label="Open Conflicts" value={openConflicts} sub={openConflicts > 0 ? 'needs review' : 'all clear'} icon={<AlertTriangle size={14} className={openConflicts > 0 ? 'text-red-500' : 'text-emerald-500'} />} />
        <MiniStat label="Members" value={members.length} sub="active" icon={<Users size={14} className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Task breakdown */}
        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Task Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Completed', count: done, total: tasks.length, color: 'bg-emerald-500' },
              { label: 'In Progress', count: inProgress, total: tasks.length, color: 'bg-blue-500' },
              { label: 'Todo', count: todo, total: tasks.length, color: 'bg-amber-400' },
              { label: 'Blocked', count: tasks.filter(t => t.status === 'blocked').length, total: tasks.length, color: 'bg-red-400' },
            ].map(({ label, count, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{label}</span>
                  <span className="tab-num font-medium text-slate-700">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', color)} style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project state KV */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Current State</h3>
          {state.length === 0 ? (
            <p className="text-xs text-slate-400">No state recorded yet</p>
          ) : (
            <div className="space-y-3">
              {state.map(kv => (
                <div key={kv.id}>
                  <p className="text-xs text-slate-400 capitalize">{kv.state_key.replace(/_/g, ' ')}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{kv.state_value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {openConflicts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">{openConflicts} open conflict{openConflicts > 1 ? 's' : ''} need review</p>
            <p className="text-xs text-amber-600 mt-0.5">Go to Decision Center to review and resolve</p>
          </div>
        </div>
      )}

      {/* Tech stack */}
      {project.technology_stack.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Technology Stack</h3>
          <div className="flex flex-wrap gap-2">
            {project.technology_stack.map(tech => (
              <span key={tech} className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      {project.requirements && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">Requirements</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{project.requirements}</p>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, sub, icon }: { label: string; value: number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-xl font-bold text-slate-900 tab-num">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

// ── Meetings Tab ──────────────────────────────────────────────────────────────

function MeetingsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['meetings', projectId], queryFn: () => getMeetings(projectId) })
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [meetingType, setMeetingType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

  const meetings = [...(data?.data ?? [])].sort((a, b) =>
    new Date(b.meeting_date ?? b.created_at).getTime() - new Date(a.meeting_date ?? a.created_at).getTime()
  )

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    try {
      const meeting = await createMeeting(projectId, { title: title.trim(), meeting_type: meetingType as Meeting['meeting_type'], transcript: transcript.trim() || undefined })
      await qc.invalidateQueries({ queryKey: ['meetings', projectId] })
      setTitle(''); setTranscript(''); setShowUpload(false)
      if (transcript.trim()) {
        setAnalyzingId(meeting.id)
        await triggerAnalysis(meeting.id).catch(() => {})
        setAnalyzingId(null)
        await qc.invalidateQueries({ queryKey: ['meetings', projectId] })
      }
    } finally { setLoading(false) }
  }

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}</div>

  return (
    <div className="max-w-3xl animate-in">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-slate-800">Meeting History</h2>
        <button
          onClick={() => setShowUpload(v => !v)}
          className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={13} />
          Add Meeting
        </button>
      </div>

      {showUpload && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm animate-in">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">New Meeting</h3>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting title…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              <option value="general">General</option>
              <option value="sprint_planning">Sprint Planning</option>
              <option value="standup">Standup</option>
              <option value="retrospective">Retrospective</option>
              <option value="technical_review">Technical Review</option>
            </select>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste transcript here (optional — triggers AI analysis)…" rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowUpload(false)} className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg">Cancel</button>
              <button onClick={handleCreate} disabled={loading || !title.trim()} className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40">
                {loading ? 'Creating…' : 'Create Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

      {meetings.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <FileText size={28} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No meetings yet</p>
          <p className="text-slate-400 text-xs mt-1">Add a meeting with a transcript to start AI analysis</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200" />
          <div className="space-y-4">
            {meetings.map(meeting => (
              <div key={meeting.id} className="relative flex gap-4 animate-in">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2',
                  meeting.status === 'analyzed' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200')}>
                  {meeting.status === 'analyzed' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{meeting.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <Calendar size={11} />
                        <span>{meeting.meeting_date ? formatDate(meeting.meeting_date) : formatDate(meeting.created_at)}</span>
                        {meeting.participants.length > 0 && <><span>·</span><Users size={11} /><span>{meeting.participants.length} participants</span></>}
                        {meeting.meeting_type && meeting.meeting_type !== 'general' && <><span>·</span><span className="capitalize">{meeting.meeting_type.replace(/_/g, ' ')}</span></>}
                      </div>
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-md font-semibold flex-shrink-0', statusColor(meeting.status))}>
                      {meeting.status}
                    </span>
                  </div>
                  {meeting.summary ? (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 mb-1">AI Summary</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{meeting.summary}</p>
                    </div>
                  ) : meeting.transcript ? (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Transcript excerpt</p>
                      <p className="text-xs text-slate-500 leading-relaxed italic line-clamp-3">{meeting.transcript.slice(0, 240)}…</p>
                      {meeting.status !== 'analyzed' && (
                        <p className="text-xs text-amber-600 font-medium mt-1.5">Analysis not yet triggered</p>
                      )}
                    </div>
                  ) : null}
                  {meeting.participants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {meeting.participants.slice(0, 6).map(p => (
                        <span key={p} className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">{p}</span>
                      ))}
                    </div>
                  )}
                  {analyzingId === meeting.id && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 font-medium">
                      <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Analyzing transcript…
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Decisions Tab ──────────────────────────────────────────────────────────────

function DecisionsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['decisions', projectId], queryFn: () => getDecisions(projectId) })
  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>

  const decisions = data?.data ?? []

  return (
    <div className="max-w-3xl animate-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-800">Decision Log</h2>
        <span className="text-xs text-slate-400 tab-num">{decisions.length} decisions</span>
      </div>
      {decisions.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">No decisions recorded yet</p>
        </div>
      )}
      <div className="space-y-3">
        {decisions.map(decision => (
          <div
            key={decision.id}
            className={cn(
              'bg-white border rounded-xl shadow-sm p-4 overflow-hidden relative',
              decision.status === 'proposed'
                ? 'border-amber-200 border-dashed'
                : decision.status === 'approved' ? 'border-emerald-200'
                : decision.status === 'superseded' ? 'border-slate-200 opacity-70'
                : 'border-slate-200',
            )}
          >
            <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
              decision.status === 'proposed' ? 'bg-amber-400' :
              decision.status === 'approved' ? 'bg-emerald-500' :
              decision.status === 'superseded' ? 'bg-slate-300' : 'bg-red-400'
            )} />
            <div className="pl-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{decision.title}</p>
                <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium flex-shrink-0', statusColor(decision.status))}>{decision.status}</span>
              </div>
              {decision.description && (
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{decision.description}</p>
              )}
              {decision.evidence.slice(0, 1).map((e, i) => (
                <blockquote key={i} className="mt-2 pl-3 border-l-2 border-slate-200 text-slate-500 text-xs italic">
                  "{e.quote}" — {e.speaker}
                </blockquote>
              ))}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 capitalize">{decision.category}</span>
                <span className="text-slate-200">·</span>
                <span className="text-xs text-slate-400 tab-num">{formatDateTime(decision.created_at)}</span>
                {decision.confidence && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400 tab-num">{Math.round(decision.confidence * 100)}% confidence</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tasks Tab ──────────────────────────────────────────────────────────────────

interface TaskEditState {
  title: string
  assigned_to_name: string
  priority: Task['priority']
  due_date: string
  status: Task['status']
}

function TasksFullTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => getTasks(projectId) })
  const { data: membersData } = useQuery({ queryKey: ['members', projectId], queryFn: () => getMembers(projectId) })
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium')
  const [newDue, setNewDue] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<TaskEditState | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const allMembers = membersData?.data ?? []

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditState({
      title: task.title,
      assigned_to_name: task.assigned_to_name ?? '',
      priority: task.priority,
      due_date: task.due_date ?? '',
      status: task.status,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditState(null)
  }

  async function saveEdit(taskId: string) {
    if (!editState) return
    setSavingId(taskId)
    try {
      await updateTask(taskId, {
        title: editState.title.trim() || undefined,
        assigned_to_name: editState.assigned_to_name || undefined,
        priority: editState.priority,
        due_date: editState.due_date || undefined,
        status: editState.status,
      })
      await qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      setEditingId(null)
      setEditState(null)
    } finally { setSavingId(null) }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setLoading(true)
    try {
      await createTask(projectId, {
        title: newTitle.trim(),
        assigned_to_name: newAssignee || undefined,
        priority: newPriority,
        due_date: newDue || undefined,
      })
      await qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      setNewTitle(''); setNewAssignee(''); setNewDue(''); setShowNew(false)
    } finally { setLoading(false) }
  }

  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>

  const tasks = data?.data ?? []
  const STATUS_OPTIONS: Task['status'][] = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled']

  const grouped: Record<string, Task[]> = {
    'In Progress': tasks.filter(t => t.status === 'in_progress'),
    'To Do': tasks.filter(t => (['todo', 'proposed'] as Task['status'][]).includes(t.status)),
    'Blocked': tasks.filter(t => t.status === 'blocked'),
    'Done': tasks.filter(t => (['completed', 'cancelled'] as Task['status'][]).includes(t.status)),
  }

  return (
    <div className="max-w-4xl animate-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-900 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tasks ({tasks.length})</h2>
        <button
          onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-sm px-4 py-2 rounded-lg transition-colors font-semibold"
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm animate-in">
          <p className="text-sm font-semibold text-slate-700 mb-3">New Task</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            </div>
            <div>
              {allMembers.length > 0 ? (
                <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                  <option value="">Unassigned</option>
                  {allMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              ) : (
                <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Assignee name…" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
              )}
            </div>
            <div>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value as Task['priority'])} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-600" />
            </div>
            <div className="flex gap-2 justify-end col-span-2">
              <button onClick={() => setShowNew(false)} className="text-xs text-slate-500 px-3 py-2 rounded-lg hover:text-slate-700">Cancel</button>
              <button onClick={handleCreate} disabled={loading || !newTitle.trim()} className="bg-[#0F172A] text-white text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-40 hover:bg-slate-800 transition-colors">
                {loading ? 'Adding…' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showNew && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <ListChecks size={28} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">No tasks yet</p>
          <p className="text-slate-400 text-xs mt-1">Upload a meeting to extract tasks automatically, or add one manually</p>
        </div>
      )}

      {Object.entries(grouped).map(([group, groupTasks]) => groupTasks.length === 0 ? null : (
        <div key={group} className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{group} <span className="font-normal normal-case">({groupTasks.length})</span></h3>
          <div className="space-y-2">
            {groupTasks.map(task => {
              const isEditing = editingId === task.id
              return (
                <div key={task.id} className={cn(
                  'bg-white border rounded-xl shadow-sm overflow-hidden',
                  task.status === 'proposed' ? 'border-amber-200 border-dashed' :
                  task.priority === 'critical' ? 'border-red-200' :
                  task.priority === 'high' ? 'border-orange-200' : 'border-slate-200',
                )}>
                  {/* Priority bar */}
                  {(task.priority === 'critical' || task.priority === 'high') && (
                    <div className={cn('h-0.5', task.priority === 'critical' ? 'bg-red-400' : 'bg-orange-400')} />
                  )}

                  {isEditing && editState ? (
                    <div className="p-4 space-y-3">
                      <input
                        value={editState.title}
                        onChange={e => setEditState(s => s ? { ...s, title: e.target.value } : s)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {/* Assignee */}
                        {allMembers.length > 0 ? (
                          <select
                            value={editState.assigned_to_name}
                            onChange={e => setEditState(s => s ? { ...s, assigned_to_name: e.target.value } : s)}
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                          >
                            <option value="">Unassigned</option>
                            {allMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select>
                        ) : (
                          <input
                            value={editState.assigned_to_name}
                            onChange={e => setEditState(s => s ? { ...s, assigned_to_name: e.target.value } : s)}
                            placeholder="Assignee…"
                            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                          />
                        )}
                        {/* Priority */}
                        <select
                          value={editState.priority}
                          onChange={e => setEditState(s => s ? { ...s, priority: e.target.value as Task['priority'] } : s)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                        {/* Status */}
                        <select
                          value={editState.status}
                          onChange={e => setEditState(s => s ? { ...s, status: e.target.value as Task['status'] } : s)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        {/* Due date */}
                        <input
                          type="date"
                          value={editState.due_date}
                          onChange={e => setEditState(s => s ? { ...s, due_date: e.target.value } : s)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-600"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(task.id)}
                          disabled={savingId === task.id}
                          className="flex items-center gap-1.5 bg-[#0F172A] text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-40"
                        >
                          <Check size={12} />{savingId === task.id ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={cancelEdit} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <X size={12} />Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{task.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                          {task.assigned_to_name && (
                            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                              <Users size={10} />{task.assigned_to_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className={cn('text-xs flex items-center gap-1 font-medium', new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-slate-500')}>
                              <Calendar size={10} />{formatDate(task.due_date)}
                            </span>
                          )}
                          <span className={cn('text-xs px-1.5 py-0.5 rounded font-semibold capitalize', severityColor(task.priority))}>
                            {task.priority}
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-md font-semibold', statusColor(task.status))}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(task)}
                        className="text-slate-300 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                        title="Edit task"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Members Tab ───────────────────────────────────────────────────────────────

function MembersFullTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['members', projectId], queryFn: () => getMembers(projectId) })
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Member['role']>('developer')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await addMember(projectId, { name: name.trim(), email: email.trim() || undefined, role })
      await qc.invalidateQueries({ queryKey: ['members', projectId] })
      setName(''); setEmail(''); setShowNew(false)
    } finally { setLoading(false) }
  }

  if (isLoading) return <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>

  const members = data?.data ?? []

  return (
    <div className="max-w-4xl animate-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-800">Team ({members.length})</h2>
        <button onClick={() => setShowNew(v => !v)} className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg transition-colors font-medium">
          <Plus size={13} />
          Add Member
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm animate-in">
          <div className="grid grid-cols-3 gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400" />
            <select value={role} onChange={e => setRole(e.target.value as Member['role'])} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400">
              <option value="pm">PM</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="qa">QA</option>
              <option value="devops">DevOps</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowNew(false)} className="text-xs text-slate-500 px-3 py-2 rounded-lg">Cancel</button>
            <button onClick={handleAdd} disabled={loading || !name.trim()} className="bg-[#0F172A] text-white text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40 hover:bg-slate-800 transition-colors">
              {loading ? 'Adding…' : 'Add Member'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {members.map(member => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-colors">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0', avatarBg(member.name))}>
              {initials(member.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">{member.name}</p>
              <p className="text-slate-400 text-xs capitalize">{member.role}</p>
              {member.email && <p className="text-slate-400 text-xs truncate">{member.email}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI Insights Tab ───────────────────────────────────────────────────────────

function InsightsTab({ projectId }: { projectId: string }) {
  const { data: risksData } = useQuery({ queryKey: ['risks', projectId], queryFn: () => getRisks(projectId) })
  const { data: conflictsData } = useQuery({ queryKey: ['conflicts', projectId], queryFn: () => getConflicts(projectId) })
  const { data: stateData } = useQuery({ queryKey: ['project-state', projectId], queryFn: () => getProjectState(projectId) })
  const { data: tasksData } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => getTasks(projectId) })

  const risks = risksData?.data ?? []
  const conflicts = (conflictsData?.data ?? []).filter(c => c.status === 'open')
  const state = stateData?.data ?? []
  const tasks = tasksData?.data ?? []

  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !(['completed', 'cancelled'] as Task['status'][]).includes(t.status))

  return (
    <div className="max-w-4xl animate-in space-y-5">
      <div>
        <h2 className="font-semibold text-slate-800 mb-1">AI Insights</h2>
        <p className="text-slate-500 text-xs">Automated analysis of project health, risks, and recommendations</p>
      </div>

      {state.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={15} className="text-blue-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Current Project State</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {state.map(kv => (
              <div key={kv.id} className="border border-slate-100 rounded-lg p-3">
                <p className="text-xs text-slate-400 capitalize">{kv.state_key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{kv.state_value}</p>
                <p className="text-xs text-slate-400 mt-1 tab-num">{formatDate(kv.updated_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {conflicts.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Open Conflicts — Action Required</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md ml-auto">{conflicts.length}</span>
          </div>
          <div className="space-y-3">
            {conflicts.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0', severityColor(c.severity))}>{c.severity}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.title}</p>
                  {c.ai_explanation && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.ai_explanation.slice(0, 160)}…</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {risks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-red-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Risk Radar</h3>
            <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md ml-auto">{risks.length} risks</span>
          </div>
          <div className="space-y-2">
            {risks.map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0', severityColor(r.severity))}>{r.severity}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.title}</p>
                  {r.description && <p className="text-xs text-slate-500 mt-0.5">{r.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-red-500" />
            <h3 className="font-semibold text-slate-800 text-sm">Overdue Tasks</h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  {t.assigned_to_name && <p className="text-xs text-slate-500">{t.assigned_to_name}</p>}
                </div>
                <span className="text-xs text-red-600 font-medium tab-num">{formatDate(t.due_date!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {conflicts.length === 0 && risks.length === 0 && overdueTasks.length === 0 && state.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <CheckCircle2 size={28} className="text-emerald-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No issues detected</p>
          <p className="text-slate-400 text-xs mt-1">Upload meetings to generate AI insights</p>
        </div>
      )}
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="h-6 w-72 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg animate-pulse mt-2" />
      </div>
    </div>
  )
}
