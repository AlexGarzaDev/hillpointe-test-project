import type { ActivityEvent } from '../models/activity-event'

const EVENT_ICONS: Record<string, string> = {
  status_changed: '→',
  task_created: '✓',
  task_closed: '✗',
  unit_status_changed: '🏠',
  tour_scheduled: '📅',
  tour_completed: '👁',
}

interface ActivityFeedProps {
  events: ActivityEvent[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">No activity yet.</p>
    )
  }

  return (
    <ol className="relative border-l border-[var(--border)] pl-4">
      {events.map((event) => (
        <li key={event.id} className="mb-5 last:mb-0">
          <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[10px]">
            {EVENT_ICONS[event.type] ?? '•'}
          </span>
          <p className="text-sm font-medium text-[var(--ink)]">
            {event.summary}
          </p>
          <time className="text-xs text-[var(--muted)]">
            {new Date(event.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </li>
      ))}
    </ol>
  )
}
