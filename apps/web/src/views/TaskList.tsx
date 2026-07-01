import type { Task, TaskState } from '../models/task'

interface TaskListProps {
  tasks: Task[]
  onStateChange: (id: string, state: TaskState) => void
}

export function TaskList({ tasks, onStateChange }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">No tasks yet.</p>
    )
  }

  const open = tasks.filter((t) => t.state === 'open')
  const done = tasks.filter((t) => t.state === 'done')

  return (
    <div className="space-y-4">
      {open.length > 0 && (
        <TaskGroup
          label="Open"
          tasks={open}
          onStateChange={onStateChange}
        />
      )}
      {done.length > 0 && (
        <TaskGroup
          label="Done"
          tasks={done}
          onStateChange={onStateChange}
        />
      )}
    </div>
  )
}

interface TaskGroupProps {
  label: string
  tasks: Task[]
  onStateChange: (id: string, state: TaskState) => void
}

function TaskGroup({ label, tasks, onStateChange }: TaskGroupProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onStateChange={onStateChange} />
        ))}
      </div>
    </div>
  )
}

interface TaskRowProps {
  task: Task
  onStateChange: (id: string, state: TaskState) => void
}

function TaskRow({ task, onStateChange }: TaskRowProps) {
  const isDone = task.state === 'done'
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const due = dueDate
    ? dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'No due date'
  const overdue = !isDone && dueDate !== null && dueDate < new Date()

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
        isDone
          ? 'border-[var(--border)] bg-[var(--surface)] opacity-50'
          : 'border-[var(--border)] bg-white'
      }`}
    >
      <input
        type="checkbox"
        checked={isDone}
        onChange={() =>
          onStateChange(task.id, isDone ? 'open' : 'done')
        }
        className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--ink)]"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            isDone ? 'line-through text-[var(--muted)]' : 'text-[var(--ink)]'
          }`}
        >
          {task.title}
        </p>
        <p
          className={`mt-0.5 text-xs ${
            overdue ? 'font-semibold text-red-500' : 'text-[var(--muted)]'
          }`}
        >
          Due {due}
          {overdue && ' · Overdue'}
        </p>
      </div>
    </div>
  )
}
