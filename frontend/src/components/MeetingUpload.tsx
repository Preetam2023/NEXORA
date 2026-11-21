// Meeting Upload — file/paste input + SSE progress bar
// Owner: Saikat (FE-4)
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, Loader2 } from 'lucide-react'
import { createMeeting, triggerAnalysis, streamMeetingAnalysis } from '@/api/client'
import type { SSEEvent, Meeting } from '@/types/api'

interface Props {
  projectId: string
  onSuccess?: (meeting: Meeting) => void
}

interface ProgressState {
  step: string
  message: string
  percentage: number
}

export default function MeetingUpload({ projectId, onSuccess }: Props) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [meetingType, setMeetingType] = useState<Meeting['meeting_type']>('general')
  const [date, setDate] = useState('')
  const [transcript, setTranscript] = useState('')
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'analyzing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<ProgressState>({ step: '', message: '', percentage: 0 })
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !transcript.trim()) return

    setPhase('uploading')
    setError('')

    try {
      // 1. Create meeting record
      const meeting = await createMeeting(projectId, {
        title,
        meeting_type: meetingType,
        meeting_date: date || undefined,
        transcript,
      })

      // 2. Trigger LangGraph analysis
      setPhase('analyzing')
      setProgress({ step: 'Starting', message: 'Initializing AI analysis...', percentage: 5 })
      await triggerAnalysis(meeting.id)

      // 3. Stream progress events
      const cleanup = streamMeetingAnalysis(meeting.id, (e: SSEEvent) => {
        if (e.type === 'progress' && 'step' in e.payload) {
          setProgress(e.payload as ProgressState)
        }
        if (e.type === 'result') {
          setPhase('done')
          setProgress({ step: 'Complete', message: 'Analysis complete!', percentage: 100 })
          void qc.invalidateQueries({ queryKey: ['meetings', projectId] })
          void qc.invalidateQueries({ queryKey: ['conflicts', projectId] })
          cleanup()
          setTimeout(() => onSuccess?.(meeting), 1000)
        }
        if (e.type === 'error' && 'error' in e.payload) {
          setError(e.payload.error as string)
          setPhase('error')
          cleanup()
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPhase('error')
    }
  }

  const isAnalyzing = phase === 'uploading' || phase === 'analyzing'

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
      <h3 className="font-semibold text-slate-800 mb-4">Upload Meeting Transcript</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Meeting Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Sprint Planning Week 2"
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAnalyzing}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Meeting Type</label>
          <select
            value={meetingType}
            onChange={e => setMeetingType(e.target.value as Meeting['meeting_type'])}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={isAnalyzing}
          >
            <option value="general">General</option>
            <option value="sprint_planning">Sprint Planning</option>
            <option value="standup">Standup</option>
            <option value="retrospective">Retrospective</option>
            <option value="technical_review">Technical Review</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">Meeting Date</label>
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isAnalyzing}
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">Transcript *</label>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Paste meeting transcript here..."
          rows={8}
          className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={isAnalyzing}
          required
        />
      </div>

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{progress.message || 'Analyzing...'}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2.5 text-sm text-emerald-700">
          Analysis complete! Conflicts and decisions have been extracted.
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isAnalyzing || phase === 'done' || !title.trim() || !transcript.trim()}
        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {isAnalyzing ? 'Analyzing...' : 'Analyze Meeting'}
      </button>
    </form>
  )
}
