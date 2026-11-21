import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
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
  const map = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }
  return map[severity]
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    proposed: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
    superseded: 'bg-slate-100 text-slate-500',
    resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    open: 'bg-orange-50 text-orange-700 border border-orange-200',
    todo: 'bg-slate-100 text-slate-600',
    in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    blocked: 'bg-red-50 text-red-600 border border-red-200',
    cancelled: 'bg-slate-100 text-slate-400',
    healthy: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    at_risk: 'bg-amber-50 text-amber-700 border border-amber-200',
    critical: 'bg-red-50 text-red-600 border border-red-200',
    analyzed: 'bg-blue-50 text-blue-700 border border-blue-200',
    analyzing: 'bg-purple-50 text-purple-700',
    pending: 'bg-slate-100 text-slate-500',
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-orange-50 text-orange-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-500'
}

export function healthDot(health: string): string {
  const map: Record<string, string> = {
    healthy: 'bg-emerald-500',
    at_risk: 'bg-amber-500',
    critical: 'bg-red-500',
  }
  return map[health] ?? 'bg-slate-400'
}

export function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function avatarBg(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
