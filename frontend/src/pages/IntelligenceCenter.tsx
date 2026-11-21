import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getConflicts, resolveConflict, rejectConflict } from '@/api/client'
import { cn, formatDateTime, severityColor } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, XCircle, ArrowLeft, Shield } from 'lucide-react'

type Filter = 'open' | 'all'

export default function IntelligenceCenter() {
  const { projectId } = useParams<{ projectId: string }>()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('open')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['conflicts', projectId],
    queryFn: () => getConflicts(projectId!),
    enabled: !!projectId,
  })

  const allConflicts = data?.data ?? []
  const conflicts = filter === 'open' ? allConflicts.filter(c => c.status === 'open') : allConflicts
  const openCount = allConflicts.filter(c => c.status === 'open').length

  async function handleResolve(conflictId: string) {
    setResolvingId(conflictId)
    try {
      await resolveConflict(conflictId, { resolution: 'Accepted' })
      await qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
      await qc.invalidateQueries({ queryKey: ['project-state', projectId] })
      await qc.invalidateQueries({ queryKey: ['decisions', projectId] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    } finally {
      setResolvingId(null)
    }
  }

  async function handleReject(conflictId: string) {
    setRejectingId(conflictId)
    try {
      await rejectConflict(conflictId)
      await qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
      await qc.invalidateQueries({ queryKey: ['project-state', projectId] })
      await qc.invalidateQueries({ queryKey: ['decisions', projectId] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/projects/${projectId}`} className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Decision Center</h1>
          </div>
          <p className="text-slate-500 text-sm ml-6">Review and resolve AI-detected conflicts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm px-3 py-1 rounded-lg font-medium', openCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
            {openCount > 0 ? `${openCount} open` : 'All resolved'}
          </span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
        {(['open', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
              filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {f === 'open' ? `Open (${openCount})` : `All (${allConflicts.length})`}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && conflicts.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
          {filter === 'open' ? (
            <>
              <CheckCircle2 size={32} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No open conflicts</p>
              <p className="text-slate-400 text-sm mt-1">All conflicts have been resolved or rejected</p>
              {allConflicts.length > 0 && (
                <button onClick={() => setFilter('all')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View resolved conflicts →
                </button>
              )}
            </>
          ) : (
            <>
              <Shield size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">No conflicts detected yet</p>
              <p className="text-slate-400 text-xs mt-1">Upload meeting transcripts to start AI analysis</p>
            </>
          )}
        </div>
      )}

      <div className="space-y-4">
        {conflicts.map(conflict => (
          <div
            key={conflict.id}
            className={cn(
              'bg-white border rounded-2xl shadow-sm overflow-hidden transition-all',
              conflict.status === 'open'
                ? 'border-amber-200'
                : conflict.status === 'resolved' ? 'border-emerald-200 opacity-80'
                : 'border-slate-200 opacity-70',
            )}
          >
            {/* Severity bar */}
            <div className={cn(
              'h-1',
              conflict.severity === 'critical' ? 'bg-red-500' :
              conflict.severity === 'high' ? 'bg-orange-400' :
              conflict.severity === 'medium' ? 'bg-amber-400' : 'bg-slate-300',
            )} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={15} className={
                      conflict.status === 'open' ? 'text-amber-500' :
                      conflict.status === 'resolved' ? 'text-emerald-500' : 'text-slate-400'
                    } />
                    <h3 className="font-semibold text-slate-900 text-sm">{conflict.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 ml-5">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', severityColor(conflict.severity))}>
                      {conflict.severity}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">{conflict.category?.replace(/_/g, ' ')}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400 tab-num">{formatDateTime(conflict.created_at)}</span>
                    {conflict.status !== 'open' && (
                      <>
                        <span className="text-slate-200">·</span>
                        <span className={cn('text-xs font-medium capitalize', conflict.status === 'resolved' ? 'text-emerald-600' : 'text-slate-500')}>
                          {conflict.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {conflict.ai_explanation && (
                <div className="ml-5 mb-4">
                  <p className="text-slate-600 text-sm leading-relaxed">{conflict.ai_explanation}</p>
                </div>
              )}

              {/* Evidence */}
              {conflict.evidence.length > 0 && (
                <div className="ml-5 mb-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence</p>
                  {conflict.evidence.map((e, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-xs text-slate-500 italic mb-1">"{e.quote}"</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {e.speaker && <span className="font-medium text-slate-600">{e.speaker}</span>}
                        <span className="capitalize">{e.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              {conflict.recommendation && (
                <div className="ml-5 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">AI Recommendation</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{conflict.recommendation.action}</p>
                  {conflict.recommendation.reason && (
                    <p className="text-xs text-slate-500 mt-1">{conflict.recommendation.reason}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              {conflict.status === 'open' && (
                <div className="flex gap-2 ml-5">
                  <button
                    onClick={() => handleResolve(conflict.id)}
                    disabled={resolvingId === conflict.id || !!rejectingId}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 size={13} />
                    {resolvingId === conflict.id ? 'Resolving…' : 'Resolve'}
                  </button>
                  <button
                    onClick={() => handleReject(conflict.id)}
                    disabled={!!resolvingId || rejectingId === conflict.id}
                    className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40"
                  >
                    <XCircle size={13} />
                    {rejectingId === conflict.id ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
