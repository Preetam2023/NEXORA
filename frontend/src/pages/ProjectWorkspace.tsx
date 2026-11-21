// Project Workspace — 6-tab project view
// Owner: Saikat (FE-3)
// Tabs: Overview | Meetings | Decisions | Tasks | Members | AI Insights
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getProject, getMeetings, getDecisions, getMembers } from '@/api/client'
import { cn, formatDate, statusColor } from '@/lib/utils'
import MeetingUpload from '@/components/MeetingUpload'
import TasksTab from '@/components/TasksTab'

type Tab = 'overview' | 'meetings' | 'decisions' | 'tasks' | 'members' | 'insights'

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId,
  })

  if (loadingProject) return <WorkspaceSkeleton />
  if (!project) return <div className="p-6 text-slate-500">Project not found.</div>

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">Completion</p>
              <p className="font-semibold text-slate-800">{project.completion_percentage}%</p>
            </div>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusColor(project.health))}>
              {project.health.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-4">
          {(['overview', 'meetings', 'decisions', 'tasks', 'members', 'insights'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {tab === 'insights' ? 'AI Insights' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && <OverviewTab project={project} />}
        {activeTab === 'meetings' && <MeetingsTab projectId={project.id} />}
        {activeTab === 'decisions' && <DecisionsTab projectId={project.id} />}
        {activeTab === 'tasks' && <TasksTab projectId={project.id} />}
        {activeTab === 'members' && <MembersTab projectId={project.id} />}
        {activeTab === 'insights' && <InsightsPlaceholder projectId={project.id} />}
      </div>
    </div>
  )
}

function OverviewTab({ project }: { project: ReturnType<typeof useQuery<Awaited<ReturnType<typeof getProject>>>>['data'] }) {
  if (!project) return null
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Requirements</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{project.requirements ?? 'No requirements documented yet.'}</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Technology Stack</h3>
        <div className="flex flex-wrap gap-2">
          {project.technology_stack.map(tech => (
            <span key={tech} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-md border border-blue-200">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MeetingsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['meetings', projectId], queryFn: () => getMeetings(projectId) })
  const [showUpload, setShowUpload] = useState(false)

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-800">Meeting History</h2>
        <button
          onClick={() => setShowUpload(v => !v)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Upload Meeting
        </button>
      </div>
      {showUpload && <div className="mb-6"><MeetingUpload projectId={projectId} onSuccess={() => setShowUpload(false)} /></div>}
      <div className="space-y-3">
        {(data?.data ?? []).map(meeting => (
          <div key={meeting.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-slate-800 text-sm">{meeting.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{meeting.meeting_date ? formatDate(meeting.meeting_date) : 'Date unknown'} · {meeting.participants.length} participants</p>
              </div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor(meeting.status))}>{meeting.status}</span>
            </div>
            {meeting.summary && <p className="text-slate-600 text-xs mt-2 leading-relaxed">{meeting.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionsTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['decisions', projectId], queryFn: () => getDecisions(projectId) })
  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}</div>
  return (
    <div className="max-w-3xl space-y-3">
      <h2 className="font-semibold text-slate-800 mb-4">Decisions Log</h2>
      {(data?.data ?? []).map(decision => (
        <div
          key={decision.id}
          className={cn(
            'bg-white border rounded-lg shadow-sm p-4',
            decision.status === 'proposed' ? 'border-amber-300 border-l-4 border-l-amber-400' : 'border-slate-200 border-l-4 border-l-emerald-400',
          )}
        >
          <div className="flex justify-between items-start">
            <p className="font-medium text-slate-800 text-sm">{decision.title}</p>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2', statusColor(decision.status))}>{decision.status}</span>
          </div>
          {decision.description && <p className="text-slate-500 text-xs mt-1">{decision.description}</p>}
          {decision.evidence.slice(0, 1).map((e, i) => (
            <blockquote key={i} className="mt-2 pl-3 border-l-2 border-slate-200 text-slate-500 text-xs italic">"{e.quote}" — {e.speaker}</blockquote>
          ))}
        </div>
      ))}
    </div>
  )
}

function MembersTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['members', projectId], queryFn: () => getMembers(projectId) })
  if (isLoading) return <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />)}</div>
  return (
    <div className="max-w-4xl">
      <h2 className="font-semibold text-slate-800 mb-4">Team Members</h2>
      <div className="grid grid-cols-3 gap-4">
        {(data?.data ?? []).map(member => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
              {member.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-800 text-sm truncate">{member.name}</p>
              <p className="text-slate-500 text-xs capitalize">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InsightsPlaceholder({ projectId }: { projectId: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-slate-500 text-sm">AI Insights — link to <a href={`/projects/${projectId}/intelligence`} className="text-blue-600 hover:underline">Intelligence Center</a> for full conflict analysis.</p>
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="h-6 w-72 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-slate-100 rounded animate-pulse mt-2" />
      </div>
    </div>
  )
}
