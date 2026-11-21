import { NavLink, useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Brain, MessageSquare, ChevronRight, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getProject, getProjects } from '@/api/client'

interface Props {
  onOpenCopilot: (projectId?: string) => void
}

export default function Sidebar({ onOpenCopilot }: Props) {
  const location = useLocation()
  const projectMatch = location.pathname.match(/\/projects\/([\w-]+)/)
  const projectId = projectMatch?.[1]

  const { data: currentProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  })
  const projects = projectsData?.data ?? []

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0F172A] flex flex-col h-full border-r border-slate-800">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>NEXORA</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

        {/* Projects section */}
        <div className="pt-4 pb-1 px-2">
          <p className="text-slate-500 text-xs font-medium">Projects</p>
        </div>

        {projects.length === 0 ? (
          <div className="px-2 py-1 text-slate-600 text-xs">No projects yet</div>
        ) : (
          projects.slice(0, 5).map(p => (
            <NavLink
              key={p.id}
              to={`/projects/${p.id}`}
              className={({ isActive }) =>
                cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group',
                  isActive || projectId === p.id
                    ? 'bg-slate-700/70 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')
              }
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="truncate text-xs">{p.name}</span>
            </NavLink>
          ))
        )}

        {/* Current project nav */}
        {projectId && currentProject && (
          <>
            <div className="pt-4 pb-1 px-2">
              <p className="text-slate-500 text-xs font-medium truncate">{currentProject.name}</p>
            </div>
            <NavItem to={`/projects/${projectId}`} icon={FolderKanban} label="Workspace" end />
            <NavItem to={`/projects/${projectId}/intelligence`} icon={Brain} label="Decision Center" />
          </>
        )}
      </nav>

      {/* Copilot button — always visible */}
      <div className="px-3 py-3 border-t border-slate-800">
        <button
          onClick={() => onOpenCopilot(projectId ?? undefined)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium"
        >
          <MessageSquare size={15} />
          <span>AI Copilot</span>
          <ChevronRight size={13} className="ml-auto opacity-60" />
        </button>
      </div>

      <div className="px-5 py-3 border-t border-slate-800/50">
        <p className="text-slate-600 text-xs">NEXORA · Demo</p>
      </div>
    </aside>
  )
}

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: LucideIcon; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  )
}
