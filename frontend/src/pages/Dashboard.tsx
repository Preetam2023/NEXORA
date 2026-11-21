import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Zap, FileText, ListChecks,
  Plus, ChevronRight, TrendingUp, Activity, Shield,
} from 'lucide-react'
import { getDashboard, getProjects, createProject, createMeeting } from '@/api/client'
import { cn, formatRelative, statusColor, healthDot } from '@/lib/utils'
import type { Project, Meeting } from '@/types/api'

interface Props {
  onOpenCopilot: (projectId?: string) => void
}

export default function Dashboard({ onOpenCopilot }: Props) {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const [showNewMeeting, setShowNewMeeting] = useState(false)

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Unable to reach backend — check Railway deployment.
      </div>
    </div>
  )

  const stats = data

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Project Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Cross-project decisions, conflicts, and task health at a glance</p>
        </div>
        <button
          onClick={() => setShowNewMeeting(true)}
          className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={15} />
          New Meeting
        </button>
      </div>

      {/* Animated conflict alert */}
      {stats.open_conflicts > 0 && (
        <div className="relative overflow-hidden bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(90deg, transparent 0%, #F59E0B20 50%, transparent 100%)', animation: 'shimmer 2s infinite' }} />
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center animate-pulse">
              <AlertTriangle size={14} className="text-amber-600" />
            </div>
          </div>
          <div className="relative flex-1">
            <p className="text-sm font-bold text-amber-900">{stats.open_conflicts} open conflict{stats.open_conflicts > 1 ? 's' : ''} need your review</p>
            <p className="text-xs text-amber-700 mt-0.5">NEXORA detected decision conflicts that require approval before they affect project state.</p>
          </div>
          <span className="relative text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 flex-shrink-0">Action Required</span>
        </div>
      )}

      {/* Glossy KPI stats */}
      <div className="grid grid-cols-4 gap-4">
        <GlossyStat
          label="Active Projects" value={stats.active_projects}
          sub="being tracked" accent="#3B82F6" icon={<Zap size={15} />}
          pct={stats.active_projects > 0 ? 100 : 0}
        />
        <GlossyStat
          label="Meetings Analyzed" value={stats.meetings_analyzed}
          sub="AI insights extracted" accent="#10B981" icon={<FileText size={15} />}
          pct={stats.meetings_analyzed > 0 ? Math.min(100, stats.meetings_analyzed * 20) : 0}
        />
        <GlossyStat
          label="Pending Tasks" value={stats.pending_tasks}
          sub="across all projects" accent="#F59E0B" icon={<ListChecks size={15} />}
          pct={stats.pending_tasks > 0 ? Math.min(100, (stats.pending_tasks / 10) * 100) : 0}
        />
        <GlossyStat
          label="Open Conflicts" value={stats.open_conflicts}
          sub={stats.open_conflicts > 0 ? 'need resolution' : 'all clear'}
          accent={stats.open_conflicts > 0 ? '#EF4444' : '#10B981'}
          icon={<Shield size={15} />}
          pct={stats.open_conflicts > 0 ? Math.min(100, stats.open_conflicts * 25) : 100}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Projects */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-slate-500" />
              <h2 className="font-bold text-slate-800 text-sm">Active Projects</h2>
            </div>
            <span className="text-xs text-slate-400 tab-num font-semibold">{stats.projects.length} total</span>
          </div>
          {stats.projects.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-400 text-sm">No projects yet — create one to get started</p>
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
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #F59E0B, transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="relative flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={12} className="text-amber-600" />
                </div>
                <h2 className="font-bold text-slate-800 text-sm">Needs Attention</h2>
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">{stats.attention_items.length}</span>
              </div>
              <div className="space-y-2">
                {stats.attention_items.map((item, i) => (
                  <Link
                    key={i}
                    to={`/projects/${item.project_id}/intelligence`}
                    className="block p-2.5 rounded-lg bg-amber-50 border border-amber-100 hover:border-amber-300 transition-colors group"
                  >
                    <p className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-amber-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.project_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)', transform: 'translate(30%, 30%)' }} />
            <div className="relative flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                <Activity size={12} className="text-blue-500" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">Recent Activity</h2>
            </div>
            {stats.recent_activity.length === 0 && (
              <p className="text-xs text-slate-400 relative">No activity yet</p>
            )}
            <div className="space-y-3 relative">
              {stats.recent_activity.map(item => (
                <div key={item.id} className="flex gap-2.5">
                  <ActivityDot action={item.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug line-clamp-2 font-medium">{item.summary || item.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-0.5 tab-num">{formatRelative(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats summary */}
          <div className="bg-[#0F172A] rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="relative flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-blue-400" />
              <h2 className="font-bold text-white text-sm">Intelligence Summary</h2>
            </div>
            <div className="relative space-y-2">
              <SummaryRow label="Projects tracked" value={stats.active_projects} color="text-blue-400" />
              <SummaryRow label="Meetings analyzed" value={stats.meetings_analyzed} color="text-emerald-400" />
              <SummaryRow label="Pending tasks" value={stats.pending_tasks} color="text-amber-400" />
              <SummaryRow label="Open conflicts" value={stats.open_conflicts} color={stats.open_conflicts > 0 ? 'text-red-400' : 'text-emerald-400'} />
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

function GlossyStat({ label, value, sub, accent, icon, pct }: {
  label: string; value: number; sub: string; accent: string; icon: React.ReactNode; pct: number
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden hover:border-slate-300 transition-colors">
      <div className="absolute inset-0 opacity-[0.04] rounded-2xl" style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18`, color: accent }}>
            {icon}
          </div>
          <span className="text-xs font-semibold text-slate-400">{label}</span>
        </div>
        <p className="text-2xl font-black text-slate-900 tab-num leading-none mb-0.5">{value}</p>
        <p className="text-xs text-slate-400 mb-2">{sub}</p>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: accent }} />
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className={cn('text-sm font-black tab-num', color)}>{value}</span>
    </div>
  )
}

function ProjectCard({ project, onOpenCopilot }: { project: Project; onOpenCopilot: (pid?: string) => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)', transform: 'translate(-40%, -40%)' }} />
      <Link to={`/projects/${project.id}`} className="block p-4 relative">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-2 h-2 rounded-full flex-shrink-0', healthDot(project.health))} />
              <h3 className="font-bold text-slate-900 text-sm truncate">{project.name}</h3>
            </div>
            <p className="text-slate-500 text-xs line-clamp-1 ml-3.5 font-medium">{project.description}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className={cn('text-xs px-2 py-0.5 rounded-md font-semibold', statusColor(project.health))}>
              {project.health.replace('_', ' ')}
            </span>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </div>

        <div className="mt-3 ml-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Progress</span>
            <span className="tab-num font-bold text-slate-700">{project.completion_percentage}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
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
              <span key={tech} className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md font-semibold">{tech}</span>
            ))}
            {project.technology_stack.length > 4 && (
              <span className="text-xs text-slate-400 font-medium">+{project.technology_stack.length - 4}</span>
            )}
          </div>
        )}
      </Link>
      <div className="border-t border-slate-100 px-4 py-2 flex gap-3 relative">
        <Link to={`/projects/${project.id}/intelligence`} className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-medium">Decision Center</Link>
        <button onClick={() => onOpenCopilot(project.id)} className="text-xs text-slate-400 hover:text-blue-600 transition-colors font-medium">Ask Copilot</button>
      </div>
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
          <h2 className="text-white font-bold">Add New Meeting</h2>
          <p className="text-slate-400 text-xs mt-0.5">Upload a transcript to trigger AI analysis</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Project</label>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode('select')} className={cn('text-xs px-3 py-1.5 rounded-md font-semibold transition-colors', mode === 'select' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                Existing project
              </button>
              <button onClick={() => setMode('new_project')} className={cn('text-xs px-3 py-1.5 rounded-md font-semibold transition-colors', mode === 'new_project' ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
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
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Meeting title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sprint Planning Week 2"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Meeting type</label>
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
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Transcript (optional)</label>
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
            className="bg-[#0F172A] hover:bg-slate-800 text-white text-sm px-5 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40"
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
    <div className="p-6 space-y-6">
      <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 h-28 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="bg-white border border-slate-200 rounded-2xl h-32 animate-pulse" />)}
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl h-40 animate-pulse" />
          <div className="bg-white border border-slate-200 rounded-2xl h-28 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
