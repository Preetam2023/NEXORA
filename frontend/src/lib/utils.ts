import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function severityColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const map = { low: 'bg-slate-100 text-slate-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' }
  return map[severity]
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    proposed: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    open: 'bg-orange-100 text-orange-700',
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    blocked: 'bg-red-100 text-red-700',
    healthy: 'bg-emerald-100 text-emerald-700',
    at_risk: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-700'
}
