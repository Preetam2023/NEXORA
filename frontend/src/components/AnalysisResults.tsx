// Analysis Results — shows extracted decisions/tasks/conflicts with Approve/Reject
// Owner: Saikat (FE-5)
import type { Decision, Task, Conflict } from '@/types/api'
import { cn, severityColor } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface Props {
  decisions: Partial<Decision>[]
  tasks: Partial<Task>[]
  conflicts: Conflict[]
  onApproveDecision?: (id: string) => void
  onRejectDecision?: (id: string) => void
  onApproveTask?: (id: string) => void
  onRejectTask?: (id: string) => void
}

export default function AnalysisResults({ decisions, tasks, conflicts, onApproveDecision, onRejectDecision, onApproveTask, onRejectTask }: Props) {
  return (
    <div className="space-y-6">
      {/* Conflicts */}
      {conflicts.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Conflicts Detected ({conflicts.length})
          </h3>
          <div className="space-y-3">
            {conflicts.map((c, i) => (
              <div key={i} className="bg-white border border-amber-300 border-l-4 border-l-amber-400 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-800 text-sm">{c.title}</p>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0', severityColor(c.severity))}>{c.severity}</span>
                </div>
                {c.ai_explanation && <p className="text-slate-500 text-xs mt-1 leading-relaxed">{c.ai_explanation}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Decisions */}
      {decisions.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-800 mb-3">Extracted Decisions ({decisions.length})</h3>
          <div className="space-y-3">
            {decisions.map((d, i) => (
              <div key={i} className="bg-white border border-amber-200 border-l-4 border-l-amber-400 border-dashed rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{d.title}</p>
                    {d.description && <p className="text-slate-500 text-xs mt-0.5">{d.description}</p>}
                    {d.evidence?.[0] && (
                      <blockquote className="mt-2 pl-3 border-l-2 border-slate-200 text-slate-500 text-xs italic">
                        "{d.evidence[0].quote}" — {d.evidence[0].speaker}
                      </blockquote>
                    )}
                  </div>
                  {(onApproveDecision || onRejectDecision) && d.id && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => onApproveDecision?.(d.id!)} className="text-emerald-600 hover:text-emerald-700" title="Approve"><CheckCircle2 size={18} /></button>
                      <button onClick={() => onRejectDecision?.(d.id!)} className="text-red-500 hover:text-red-600" title="Reject"><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-800 mb-3">Extracted Tasks ({tasks.length})</h3>
          <div className="space-y-3">
            {tasks.map((t, i) => (
              <div key={i} className="bg-white border border-amber-200 border-l-4 border-l-amber-400 border-dashed rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{t.title}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      {t.assigned_to_name && <span>Assigned: {t.assigned_to_name}</span>}
                      {t.due_date && <span>Due: {t.due_date}</span>}
                      {t.priority && <span className="capitalize">{t.priority} priority</span>}
                    </div>
                  </div>
                  {(onApproveTask || onRejectTask) && t.id && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => onApproveTask?.(t.id!)} className="text-emerald-600 hover:text-emerald-700" title="Approve"><CheckCircle2 size={18} /></button>
                      <button onClick={() => onRejectTask?.(t.id!)} className="text-red-500 hover:text-red-600" title="Reject"><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
