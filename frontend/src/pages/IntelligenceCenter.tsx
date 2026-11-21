import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getConflicts, resolveConflict, rejectConflict } from '@/api/client'
import type { Conflict } from '@/types/api'
import { cn, formatDate, formatDateTime, severityColor } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, XCircle, ArrowLeft, Shield, Zap } from 'lucide-react'

type Filter = 'open' | 'all'

// Generate 2-3 recommendation options from a conflict's recommendation data
function buildRecommendationOptions(conflict: Conflict) {
  const primary = conflict.recommendation
  if (!primary) return []

  const score = conflict.confidence ? Math.round(conflict.confidence * 100) : 87

  const options = [
    {
      id: 'accept',
      label: primary.action,
      rationale: primary.reason,
      pros: primary.pros ?? [],
      cons: primary.cons ?? [],
      score,
      tag: 'AI Recommended',
      tagColor: 'bg-blue-50 text-blue-700 border border-blue-200',
      borderColor: 'border-blue-300',
      bgColor: 'bg-blue-50/40',
    },
    {
      id: 'keep_previous',
      label: 'Keep previous state',
      rationale: `Revert to the state from ${conflict.previous_state?.meeting ?? 'earlier meeting'} and discard the new proposal.`,
      pros: ['Maintains continuity', 'No disruption to current assignments', 'Lower risk'],
      cons: ['Ignores new information', 'May cause team confusion if already communicated'],
      score: Math.max(score - 22, 35),
      tag: 'Conservative',
      tagColor: 'bg-slate-100 text-slate-600',
      borderColor: 'border-slate-200',
      bgColor: 'bg-white',
    },
    {
      id: 'defer',
      label: 'Defer — flag for team review',
      rationale: 'Mark as pending team discussion. No automatic changes — a human will decide in the next standup.',
      pros: ['Team consensus', 'No unilateral AI changes', 'Preserves options'],
      cons: ['Leaves conflict unresolved', 'Requires manual follow-up', 'Delays decision'],
      score: Math.max(score - 38, 20),
      tag: 'Manual',
      tagColor: 'bg-amber-50 text-amber-700 border border-amber-200',
      borderColor: 'border-slate-200',
      bgColor: 'bg-white',
    },
  ]
  return options
}

export default function IntelligenceCenter() {
  const { projectId } = useParams<{ projectId: string }>()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<Filter>('open')
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
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

  async function handleResolve(conflict: Conflict) {
    const selectedOpt = selectedOptions[conflict.id] ?? 'accept'
    const opts = buildRecommendationOptions(conflict)
    const chosen = opts.find(o => o.id === selectedOpt)
    setResolvingId(conflict.id)
    try {
      await resolveConflict(conflict.id, { resolution: chosen?.label ?? 'Accepted' })
      await qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
      await qc.invalidateQueries({ queryKey: ['project-state', projectId] })
      await qc.invalidateQueries({ queryKey: ['decisions', projectId] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedConflict(null)
    } finally { setResolvingId(null) }
  }

  async function handleReject(conflictId: string) {
    setRejectingId(conflictId)
    try {
      await rejectConflict(conflictId)
      await qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
      await qc.invalidateQueries({ queryKey: ['project-state', projectId] })
      await qc.invalidateQueries({ queryKey: ['decisions', projectId] })
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedConflict(null)
    } finally { setRejectingId(null) }
  }

  return (
    <div className="p-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Link to={`/projects/${projectId}`} className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Decision Center</h1>
          </div>
          <p className="text-slate-500 text-sm ml-7">Review AI-detected conflicts and select a resolution</p>
        </div>
        <span className={cn('text-sm px-3 py-1.5 rounded-lg font-semibold', openCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')}>
          {openCount > 0 ? `${openCount} open` : 'All resolved'}
        </span>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {(['open', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 text-sm font-semibold rounded-lg transition-all',
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
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-14 text-center">
          {filter === 'open' ? (
            <>
              <CheckCircle2 size={36} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-slate-700 font-semibold text-base">No open conflicts</p>
              <p className="text-slate-400 text-sm mt-1">All conflicts have been resolved or rejected</p>
              {allConflicts.length > 0 && (
                <button onClick={() => setFilter('all')} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  View resolved conflicts →
                </button>
              )}
            </>
          ) : (
            <>
              <Shield size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No conflicts detected yet</p>
              <p className="text-slate-400 text-xs mt-1">Upload meeting transcripts to start AI analysis</p>
            </>
          )}
        </div>
      )}

      <div className="space-y-5">
        {conflicts.map(conflict => {
          const isOpen = conflict.status === 'open'
          const isExpanded = selectedConflict === conflict.id
          const opts = buildRecommendationOptions(conflict)
          const selectedOptId = selectedOptions[conflict.id] ?? 'accept'

          return (
            <div
              key={conflict.id}
              className={cn(
                'bg-white border rounded-2xl shadow-sm overflow-hidden transition-all',
                isOpen ? 'border-amber-200' :
                conflict.status === 'resolved' ? 'border-emerald-200 opacity-80' : 'border-slate-200 opacity-70',
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
                {/* Title row */}
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => setSelectedConflict(isExpanded ? null : conflict.id)}
                >
                  <AlertTriangle size={16} className={cn('mt-0.5 flex-shrink-0',
                    isOpen ? 'text-amber-500' :
                    conflict.status === 'resolved' ? 'text-emerald-500' : 'text-slate-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{conflict.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded font-semibold', severityColor(conflict.severity))}>
                        {conflict.severity}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">{conflict.category?.replace(/_/g, ' ')}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400 tab-num">{formatDateTime(conflict.created_at)}</span>
                      {!isOpen && (
                        <span className={cn('text-xs font-semibold capitalize', conflict.status === 'resolved' ? 'text-emerald-600' : 'text-slate-500')}>
                          {conflict.status}
                          {conflict.resolved_at && ` · ${formatDate(conflict.resolved_at)}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 hover:text-slate-600 font-medium flex-shrink-0 mt-0.5">
                    {isExpanded ? 'Collapse ↑' : 'Review ↓'}
                  </span>
                </div>

                {/* AI explanation — always visible */}
                {conflict.ai_explanation && (
                  <p className="text-slate-600 text-sm leading-relaxed mt-3 ml-6">{conflict.ai_explanation}</p>
                )}

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-4 ml-6 space-y-4 animate-in">
                    {/* Evidence */}
                    {conflict.evidence.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Evidence</p>
                        <div className="space-y-2">
                          {conflict.evidence.map((e, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                              <p className="text-xs text-slate-600 italic mb-1">"{e.quote}"</p>
                              <div className="flex items-center gap-2 text-xs">
                                {e.speaker && <span className="font-semibold text-slate-700">{e.speaker}</span>}
                                <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium capitalize',
                                  e.source === 'historical' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700')}>
                                  {e.source}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* State comparison */}
                    {(conflict.previous_state || conflict.new_state) && (
                      <div className="grid grid-cols-2 gap-3">
                        {conflict.previous_state && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-400 mb-1">Previous</p>
                            <p className="text-sm font-semibold text-slate-800">{conflict.previous_state.description}</p>
                            <p className="text-xs text-slate-400 mt-1">{conflict.previous_state.meeting}</p>
                          </div>
                        )}
                        {conflict.new_state && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-600 mb-1">Proposed</p>
                            <p className="text-sm font-semibold text-slate-800">{conflict.new_state.description}</p>
                            <p className="text-xs text-slate-400 mt-1">{conflict.new_state.meeting}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendation cards — 3 per row, score meter, vertical pros/cons */}
                    {isOpen && opts.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Zap size={11} />
                          AI Recommendations — select one to approve
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {opts.map(opt => {
                            const isSelected = selectedOptId === opt.id
                            const scoreColor = opt.score >= 70 ? '#10B981' : opt.score >= 50 ? '#F59E0B' : '#EF4444'
                            const scoreBg = opt.score >= 70 ? 'bg-emerald-500' : opt.score >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setSelectedOptions(prev => ({ ...prev, [conflict.id]: opt.id }))}
                                className={cn(
                                  'text-left w-full border-2 rounded-xl p-4 transition-all flex flex-col',
                                  isSelected ? `${opt.borderColor} ${opt.bgColor} ring-2 ring-blue-500/20` : 'border-slate-200 bg-white hover:border-slate-300',
                                )}
                              >
                                {/* Header: radio + tag */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className={cn('w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300')}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-semibold', opt.tagColor)}>{opt.tag}</span>
                                </div>

                                {/* Title */}
                                <p className="font-bold text-slate-900 text-xs leading-snug mb-1.5">{opt.label}</p>

                                {/* AI Score meter */}
                                <div className="mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-400">AI Score</span>
                                    <span className="text-xs font-bold tab-num" style={{ color: scoreColor }}>{opt.score}/100</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all duration-500', scoreBg)} style={{ width: `${opt.score}%` }} />
                                  </div>
                                </div>

                                {/* Rationale */}
                                <p className="text-xs text-slate-500 leading-relaxed mb-2.5">{opt.rationale}</p>

                                {/* Pros */}
                                {opt.pros.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs font-semibold text-emerald-600 mb-1">Pros</p>
                                    <ul className="space-y-0.5">
                                      {opt.pros.slice(0, 3).map((p, i) => (
                                        <li key={i} className="text-xs text-slate-500 flex gap-1.5"><span className="text-emerald-400 flex-shrink-0">+</span>{p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Cons */}
                                {opt.cons.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-red-500 mb-1">Cons</p>
                                    <ul className="space-y-0.5">
                                      {opt.cons.slice(0, 3).map((c, i) => (
                                        <li key={i} className="text-xs text-slate-500 flex gap-1.5"><span className="text-red-400 flex-shrink-0">−</span>{c}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {isOpen && (
                      <div className="flex gap-3 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleResolve(conflict)}
                          disabled={resolvingId === conflict.id || !!rejectingId}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-40 shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          {resolvingId === conflict.id ? 'Applying…' : 'Approve Selected'}
                        </button>
                        <button
                          onClick={() => handleReject(conflict.id)}
                          disabled={!!resolvingId || rejectingId === conflict.id}
                          className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 text-sm px-5 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-40"
                        >
                          <XCircle size={14} />
                          {rejectingId === conflict.id ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {!isOpen && (
                      <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold',
                        conflict.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600')}>
                        {conflict.status === 'resolved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {conflict.status === 'resolved' ? 'Resolved' : 'Rejected'}
                        {conflict.resolved_at && <span className="text-xs font-normal text-slate-400 tab-num">· {formatDate(conflict.resolved_at)}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
