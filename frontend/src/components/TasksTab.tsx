// Tasks Tab — task list with status updates
// Owner: Saikat (FE-7)
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTasks, updateTask } from '@/api/client'
import type { Task } from '@/types/api'
import { cn, formatDate, statusColor } from '@/lib/utils'

interface Props {
  projectId: string
}

const STATUS_OPTIONS: Task['status'][] = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled']

export default function TasksTab({ projectId }: Props) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => getTasks(projectId) })

  async function handleStatusChange(taskId: string, status: Task['status']) {
    await updateTask(taskId, { status })
    await qc.invalidateQueries({ queryKey: ['tasks', projectId] })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)}
      </div>
    )
  }

  const tasks = data?.data ?? []
  const grouped = {
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    todo: tasks.filter(t => t.status === 'todo' || t.status === 'proposed'),
    blocked: tasks.filter(t => t.status === 'blocked'),
    done: tasks.filter(t => t.status === 'completed' || t.status === 'cancelled'),
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-slate-800">Task Board ({tasks.length})</h2>
      </div>

      {tasks.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-400 text-sm">
          No tasks yet. Upload a meeting to extract tasks automatically.
        </div>
      )}

      {Object.entries(grouped).map(([group, groupTasks]) => (
        groupTasks.length > 0 ? (
          <div key={group} className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 capitalize">
              {group.replace('_', ' ')} ({groupTasks.length})
            </h3>
            <div className="space-y-2">
              {groupTasks.map(task => (
                <TaskRow key={task.id} task={task} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        ) : null
      ))}
    </div>
  )
}

function TaskRow({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, s: Task['status']) => void }) {
  return (
    <div className={cn(
      'bg-white border rounded-lg shadow-sm p-4',
      task.status === 'proposed' ? 'border-amber-200 border-l-4 border-l-amber-400 border-dashed' : 'border-slate-200',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm">{task.title}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
            {task.assigned_to_name && <span>Assigned: <span className="text-slate-700">{task.assigned_to_name}</span></span>}
            {task.due_date && <span>Due: <span className="text-slate-700">{formatDate(task.due_date)}</span></span>}
            <span className={cn('px-1.5 py-0.5 rounded font-medium capitalize', statusColor(task.priority))}>{task.priority}</span>
          </div>
        </div>
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value as Task['status'])}
          className={cn('text-xs px-2 py-1 rounded border font-medium bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer', statusColor(task.status))}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
