import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, Zap, FileText, ListChecks, AlertCircle, Plus, ChevronRight } from 'lucide-react'
import { getDashboard, getProjects, createProject, createMeeting } from '@/api/client'
import { cn, formatRelative, statusColor, healthDot } from '@/lib/utils'
import type { Project } from '@/types/api'

interface Props {
  onOpenCopilot: (projectId?: string) => void
}

export default function Dashboard({ onOpenCopilot }: Props) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const [showNewMeeting, setShowNewMeeting] = useState(false)

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Unable to reach backend — check Railway deployment.
      </div>
    </div>
  )

  const stats = data

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Project intelligence across all active work</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewMeeting(true)}
            className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={15} />
            New Meeting
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={stats.active_projects} icon={<Zap size={16} className="text-blue-500" />} accent="blue" />
        <StatCard label="Meetings Analyzed" value={stats.meetings_analyzed} icon={<FileText size={16} className="text-emerald-500" />} accent="emerald" />
        <StatCard label="Pending Tasks" value={stats.pending_tasks} icon={<ListChecks size={16} className="text-amber-500" />} accent="amber" />
        <StatCard label="Open Conflicts" value={stats.open_conflicts} icon={<AlertCircle size={16} className="text-red-500" />} accent="red" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Projects */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">Active Projects</h2>
            <span className="text-xs text-slate-400 tab-num">{stats.projects.length} total</span>
          </div>
          {stats.projects.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-400 text-sm">No projects yet</p>
            </div>
          )}
          {stats.projects.map(project => (
            <ProjectCard key={project.id} project={project} onOpenCopilot={onOpenCopilot} />
          ))}
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* AI Attention */}
          {stats.attention_items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-500" />
                <h2 className="font-semibold text-slate-800 text-sm">Needs Attention</h2>
              </div>
              <div className="space-y-2">
                {stats.attention_items.map((item, i) => (
                  <Link
                    key={i}
                    to={`/projects/${item.project_id}/intelligence`}
                    className="block p-2.5 rounded-lg bg-amber-50 border border-amber-100 hover:border-amber-300 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-800 leading-snug">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.project_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-slate-800 text-sm mb-3">Recent Activity</h2>
            {stats.recent_activity.length === 0 && (
              <p className="text-xs text-slate-400">No activity yet</p>
            )}
            <div className="space-y-3">
              {stats.recent_activity.map(item => (
                <div key={item.id} className="flex gap-2.5">
                  <ActivityDot action={item.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug line-clamp-2">{item.summary || item.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-0.5 tab-num">{formatRelative(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewMeeting && (
        <NewMeetingModal
          projects={stats.projects}
          onClose={() => setShowNewMeeting(false)}
        />
      )}
    </div>
  )
}

function ProjectCard({ project, onOpenCopilot }: { project: Project; onOpenCopilot: (pid?: string) => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all group overflow-hidden">
      <Link to={`/projects/${project.id}`} className="block p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', healthDot(project.health))} />
              <h3 className="font-semibold text-slate-900 text-sm truncate">{project.name}</h3>
            </div>
            <p className="text-slate-500 text-xs line-clamp-1 ml-3.5">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', statusColor(project.health))}>
              {project.health.replace('_', ' ')}
            </span>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </div>

        <div className="mt-3 ml-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Progress</span>
            <span className="tab-num font-medium text-slate-600">{project.completion_percentage}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${project.completion_percentage}%`,
                background: project.completion_percentage > 70 ? '#10B981' : project.completion_percentage > 40 ? '#3B82F6' : '#F59E0B',
              }}
            />
          </div>
        </div>

        {project.technology_stack.length > 0 && (
          <div className="mt-3 ml-3.5 flex flex-wrap gap-1.5">
            {project.technology_stack.slice(0, 4).map(tech => (
              <span key={tech} className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md">{tech}</span>
            ))}
          </div>
        )}
      </Link>
      <div className="border-t border-slate-100 px-4 py-2 flex gap-3">
        <Link to={`/projects/${project.id}/intelligence`} className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Decision Center</Link>
        <button onClick={() => onOpenCopilot(project.id)} className="text-xs text-slate-400 hover:text-blue-600 transition-colors">Ask Copilot</button>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  const bg = { blue: 'bg-blue-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', red: 'bg-red-50' }[accent] ?? 'bg-slate-50'
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bg)}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tab-num">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function ActivityDot({ action }: { action: string }) {
  if (action.includes('conflict')) return <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
  if (action.includes('approved') || action.includes('resolved')) return <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
  return <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
}

function NewMeetingModal({ projects, onClose }: { projects: Project[]; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: allProjects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })
  const allP = allProjects?.data ?? projects

  const [selectedProjectId, setSelectedProjectId] = useState(allP[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [meetingType, setMeetingType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'select' | 'new_project'>('select')
  const [newProjectName, setNewProjectName] = useState('')

  async function handleSubmit() {
    if (!title.trim() || (!selectedProjectId && mode === 'select')) return
    setLoading(true)
    try {
      let pid = selectedProjectId
      if (mode === 'new_project') {
        const proj = await createProject({ name: newProjectName, description: '' })
        pid = proj.id
        await qc.invalidateQueries({ queryKey: ['projects'] })
        await qc.invalidateQueries({ queryKey: ['dashboard'] })
      }
      await createMeeting(pid, { title: title.trim(), meeting_type: meetingType as Meeting['meeting_type'], transcript: transcript.trim() || undefined })
      await qc.invalidateQueries({ queryKey: ['meetings', pid] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-[#0F172A]">
          <h2 className="text-white font-semibold">Add New Meeting</h2>
          <p className="text-slate-400 text-xs mt-0.5">Upload a transcript to trigger AI analysis</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Project</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode('select')} className={cn('text-xs px-3 py-1.5 rounded-md font-medium transition-colors', mode === 'select' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                Existing project
              </button>
              <button onClick={() => setMode('new_project')} className={cn('text-xs px-3 py-1.5 rounded-md font-medium transition-colors', mode === 'new_project' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                Create new project
              </button>
            </div>
            {mode === 'select' ? (
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                {allP.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <input
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Project name…"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Meeting title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning Week 2"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Meeting type</label>
            <select
              value={meetingType}
              onChange={e => setMeetingType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              <option value="general">General</option>
              <option value="sprint_planning">Sprint Planning</option>
              <option value="standup">Standup</option>
              <option value="retrospective">Retrospective</option>
              <option value="technical_review">Technical Review</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Transcript (optional)</label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste meeting transcript here…"
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
          >
            {loading ? 'Creating…' : 'Create Meeting'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-24 animate-pulse" />)}
      </div>
    </div>
  )
}

// Import needed for type in NewMeetingModal
import type { Meeting } from '@/types/api'
