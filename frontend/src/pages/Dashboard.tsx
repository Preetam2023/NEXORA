// Dashboard — Organization overview
// Owner: Saikat (FE-2)
// Shows: stats cards, project list, AI attention items, recent activity
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Zap, FileText, ListChecks, AlertCircle } from 'lucide-react'
import { getDashboard } from '@/api/client'
import { cn, formatRelative, statusColor } from '@/lib/utils'

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data) return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Organization Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Project intelligence across all active work</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        Backend not connected — start the FastAPI server at <code className="font-mono">localhost:8000</code> to load live data.
      </div>
    </div>
  )

  const stats = data

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Organization Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Project intelligence across all active work</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Projects"    value={stats.active_projects}  icon={<Zap size={18} className="text-blue-600" />} />
        <StatCard label="Meetings Analyzed"  value={stats.meetings_analyzed} icon={<FileText size={18} className="text-emerald-600" />} />
        <StatCard label="Pending Tasks"      value={stats.pending_tasks}     icon={<ListChecks size={18} className="text-amber-600" />} />
        <StatCard label="Open Conflicts"     value={stats.open_conflicts}    icon={<AlertCircle size={18} className="text-red-600" />} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-800">Active Projects</h2>
          {stats.projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">{project.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{project.description}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor(project.health))}>
                  {project.health.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Completion</span>
                  <span>{project.completion_percentage}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${project.completion_percentage}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {project.technology_stack.slice(0, 4).map(tech => (
                  <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{tech}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Attention Items */}
          {stats.attention_items.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-800 mb-3">AI Attention Required</h2>
              <div className="space-y-2">
                {stats.attention_items.map((item, i) => (
                  <div key={i} className="bg-white border border-amber-200 rounded-lg p-3 border-l-4 border-l-amber-400">
                    <p className="text-xs font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.project_name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">Recent Activity</h2>
            <div className="space-y-3">
              {stats.recent_activity.map(item => (
                <div key={item.id} className="flex gap-3">
                  <ActivityIcon action={item.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug line-clamp-2">{item.summary}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelative(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('conflict')) return <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
  if (action.includes('approved')) return <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
  return <FileText size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
}

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="h-7 w-56 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-slate-100 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 h-20 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
