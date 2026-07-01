export type { ActivityEvent } from '@hillpointe/shared'

// Re-export ActivityEventType for backward compatibility with views
export type ActivityEventType =
  | 'status_changed'
  | 'task_created'
  | 'task_closed'
  | 'unit_status_changed'
  | 'tour_scheduled'
  | 'tour_completed'
