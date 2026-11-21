// Header — top bar with breadcrumb and org name
// Owner: Saikat (FE-1)
import { Bell } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <span className="text-sm font-medium text-slate-900">ACME Corp</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
          R
        </div>
      </div>
    </header>
  )
}
