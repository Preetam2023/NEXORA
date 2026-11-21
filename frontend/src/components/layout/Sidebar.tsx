// Sidebar — fixed 240px, navy background
// Owner: Saikat (FE-1)
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Brain, MessageSquare, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
]

export default function Sidebar() {
  const location = useLocation()

  // Derive active project from URL for project-scoped nav
  const projectMatch = location.pathname.match(/\/projects\/([\w-]+)/)
  const projectId = projectMatch?.[1]

  const projectNav = projectId ? [
    { to: `/projects/${projectId}`, icon: FolderKanban, label: 'Workspace' },
    { to: `/projects/${projectId}/intelligence`, icon: Brain, label: 'Intelligence' },
    { to: `/projects/${projectId}/copilot`, icon: MessageSquare, label: 'Copilot' },
  ] : []

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0F172A] flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">NEXORA</span>
        </div>
        <p className="text-slate-400 text-xs mt-1">Project Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {projectNav.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Current Project</p>
            </div>
            {projectNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white')
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/50">
        <p className="text-slate-500 text-xs">Hackathon Demo v0.1</p>
      </div>
    </aside>
  )
}
