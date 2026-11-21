// Intelligence Center — conflict list + detail panel
// Owner: Saikat (FE-6)
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { getConflicts, resolveConflict, rejectConflict } from '@/api/client'
import type { Conflict } from '@/types/api'
import { cn, formatDate, severityColor } from '@/lib/utils'

export default function IntelligenceCenter() {
  const { projectId } = useParams<{ projectId: string }>()
  const [selected, setSelected] = useState<Conflict | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['conflicts', projectId],
    queryFn: () => getConflicts(projectId!),
    enabled: !!projectId,
  })

  if (isLoading) return (
    <div className="p-6">
      <div className="h-7 w-56 bg-slate-200 rounded animate-pulse mb-6" />
      <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />)}</div>
    </div>
  )

  const conflicts = data?.data ?? []

  return (
    <div className="flex h-full">
      {/* Conflict List */}
      <div className="w-96 flex-shrink-0 border-r border-slate-200 overflow-auto">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-lg font-semibold text-slate-900">AI Intelligence Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">{conflicts.length} conflicts detected</p>
        </div>
        <div className="p-3 space-y-2">
          {conflicts.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-sm">No conflicts detected yet.</div>
          )}
          {conflicts.map(conflict => (
            <button
              key={conflict.id}
              onClick={() => setSelected(conflict)}
              className={cn(
                'w-full text-left bg-white border rounded-lg p-3 hover:border-blue-300 transition-colors',
                selected?.id === conflict.id ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{conflict.title}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', severityColor(conflict.severity))}>{conflict.severity}</span>
                <span className="text-xs text-slate-400 capitalize">{conflict.status}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="flex-1 overflow-auto">
        {selected ? (
          <ConflictDetail conflict={selected} projectId={projectId!} onClose={() => setSelected(null)} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <AlertTriangle size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Select a conflict to review</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConflictDetail({ conflict, projectId, onClose }: { conflict: Conflict; projectId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  async function handleResolve() {
    setLoading(true)
    try {
      await resolveConflict(conflict.id, { resolution: conflict.recommendation?.action ?? 'Approved' })
      await qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
      onClose()
    } finally { setLoading(false) }
  }

  async function handleReject() {
    setLoading(true)
    try {
      await rejectConflict(conflict.id)
      await qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', severityColor(conflict.severity))}>{conflict.severity} severity</span>
            <span className="text-xs text-slate-400 capitalize">{conflict.category.replace('_', ' ')}</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{conflict.title}</h2>
        </div>
      </div>

      {/* Evidence comparison */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Previous State</p>
          <p className="text-sm font-medium text-slate-800">{conflict.previous_state.description}</p>
          <p className="text-xs text-slate-400 mt-1">{conflict.previous_state.meeting} · {conflict.previous_state.meeting_date ? formatDate(conflict.previous_state.meeting_date) : ''}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">New State (Proposed)</p>
          <p className="text-sm font-medium text-slate-800">{conflict.new_state.description}</p>
          <p className="text-xs text-slate-400 mt-1">{conflict.new_state.meeting} · {conflict.new_state.meeting_date ? formatDate(conflict.new_state.meeting_date) : ''}</p>
        </div>
      </div>

      {/* Evidence quotes */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evidence</p>
        <div className="space-y-3">
          {conflict.evidence.map((e, i) => (
            <div key={i} className="flex gap-3">
              <span className={cn('text-xs px-1.5 py-0.5 rounded flex-shrink-0 h-fit font-medium', e.source === 'historical' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700')}>{e.source}</span>
              <div>
                <p className="text-xs text-slate-700 italic">"{e.quote}"</p>
                <p className="text-xs text-slate-400 mt-0.5">— {e.speaker}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Explanation */}
      {conflict.ai_explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">AI Analysis</p>
          <p className="text-sm text-slate-700 leading-relaxed">{conflict.ai_explanation}</p>
        </div>
      )}

      {/* Recommendation */}
      {conflict.recommendation && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Recommended Action</p>
          <p className="text-sm font-medium text-slate-800 mb-2">{conflict.recommendation.action}</p>
          <p className="text-sm text-slate-600 mb-4">{conflict.recommendation.reason}</p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-emerald-700 mb-1">Pros</p>
              <ul className="space-y-1">{conflict.recommendation.pros.map((p, i) => <li key={i} className="text-slate-600">· {p}</li>)}</ul>
            </div>
            <div>
              <p className="font-semibold text-red-600 mb-1">Cons</p>
              <ul className="space-y-1">{conflict.recommendation.cons.map((c, i) => <li key={i} className="text-slate-600">· {c}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {conflict.status === 'open' && (
        <div className="flex gap-3">
          <button
            onClick={handleResolve}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            Approve & Apply
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <XCircle size={16} />
            Reject
          </button>
        </div>
      )}
      {conflict.status !== 'open' && (
        <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium', conflict.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
          <CheckCircle2 size={16} />
          {conflict.status === 'resolved' ? 'Resolved' : 'Rejected'}
        </div>
      )}
    </div>
  )
}
