// ---------------------------------------------------------------------------
// Canonical domain types — single source of truth for API and web
// ---------------------------------------------------------------------------

export type UnitStatus = 'available' | 'held' | 'leased'
export interface Unit {
  id: string
  name: string
  status: UnitStatus
}

// ---------------------------------------------------------------------------

export type ProspectStatus =
  | 'new'
  | 'contacted'
  | 'tour_scheduled'
  | 'toured'
  | 'application'
  | 'leased'
  | 'lost'

export interface Prospect {
  id: string
  name: string
  email: string
  phone: string | null
  assignedUnitId: string | null
  status: ProspectStatus
}

// ---------------------------------------------------------------------------

export type TourOutcome = 'completed' | 'no_show' | 'cancelled' | null

export interface Tour {
  id: string
  prospectId: string
  unitId: string
  scheduledTime: string // ISO-8601
  outcome: TourOutcome
}

// ---------------------------------------------------------------------------

export type TaskState = 'open' | 'done'

export interface Task {
  id: string
  prospectId: string
  title: string
  state: TaskState
  dueDate: string | null // ISO-8601
}

// ---------------------------------------------------------------------------

export interface ActivityEvent {
  id: string
  prospectId: string
  type: string
  summary: string
  timestamp: string // ISO-8601
  previousStatus: string | null
  newStatus: string | null
}

// ---------------------------------------------------------------------------
// Pipeline types
// ---------------------------------------------------------------------------

export interface CreateTaskEffect {
  type: 'create_task'
  titleTemplate: string
  dueDaysOffset: number
  dueDateAnchor: 'now' | 'tour'
}

export interface CloseOpenTasksEffect {
  type: 'close_tasks'
}

export interface UpdateUnitStatusEffect {
  type: 'update_unit'
  status: UnitStatus
}

export type RuleEffect = CreateTaskEffect | CloseOpenTasksEffect | UpdateUnitStatusEffect

export interface PipelineRule {
  toStatus: ProspectStatus
  effects: RuleEffect[]
}

// ---------------------------------------------------------------------------
// Pipeline rules — single registry consumed by both API and web
// ---------------------------------------------------------------------------

export const PIPELINE_RULES: PipelineRule[] = [
  {
    toStatus: 'contacted',
    effects: [
      {
        type: 'create_task',
        titleTemplate: 'Send tour availability to {prospect.name}',
        dueDaysOffset: 2,
        dueDateAnchor: 'now',
      },
    ],
  },
  {
    toStatus: 'tour_scheduled',
    effects: [
      {
        type: 'create_task',
        titleTemplate: 'Confirm tour 24h prior',
        dueDaysOffset: -1,
        dueDateAnchor: 'tour',
      },
    ],
  },
  {
    toStatus: 'toured',
    effects: [
      {
        type: 'create_task',
        titleTemplate: 'Send application link to {prospect.name}',
        dueDaysOffset: 1,
        dueDateAnchor: 'now',
      },
    ],
  },
  {
    toStatus: 'application',
    effects: [
      {
        type: 'create_task',
        titleTemplate: 'Review application for {prospect.name}',
        dueDaysOffset: 3,
        dueDateAnchor: 'now',
      },
    ],
  },
  {
    toStatus: 'leased',
    effects: [
      { type: 'update_unit', status: 'leased' },
      { type: 'close_tasks' },
    ],
  },
  {
    toStatus: 'lost',
    effects: [{ type: 'close_tasks' }],
  },
]

// ---------------------------------------------------------------------------
// Pipeline executor — pure function, no side-effects
// ---------------------------------------------------------------------------

export interface PipelineTransitionResult {
  tasksToCreate: Omit<Task, 'id'>[]
  taskIdsToClose: string[]
  unitStatusUpdate: UnitStatus | null
  activityEvent: Omit<ActivityEvent, 'id'>
}

function addDays(base: Date, days: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function resolveTitle(template: string, prospect: Prospect): string {
  return template.replace('{prospect.name}', prospect.name)
}

export function applyPipelineTransition(
  prospect: Prospect,
  toStatus: ProspectStatus,
  openTasks: Task[],
  nextTour: Tour | undefined,
  now: Date = new Date(),
): PipelineTransitionResult {
  const rule = PIPELINE_RULES.find((r) => r.toStatus === toStatus)

  const tasksToCreate: Omit<Task, 'id'>[] = []
  const taskIdsToClose: string[] = []
  let unitStatusUpdate: UnitStatus | null = null

  if (rule) {
    for (const effect of rule.effects) {
      switch (effect.type) {
        case 'create_task': {
          const dueDate =
            effect.dueDateAnchor === 'tour' && nextTour
              ? addDays(new Date(nextTour.scheduledTime), effect.dueDaysOffset)
              : addDays(now, effect.dueDaysOffset)
          tasksToCreate.push({
            title: resolveTitle(effect.titleTemplate, prospect),
            prospectId: prospect.id,
            state: 'open',
            dueDate,
          })
          break
        }
        case 'close_tasks': {
          taskIdsToClose.push(
            ...openTasks.filter((t) => t.state === 'open').map((t) => t.id),
          )
          break
        }
        case 'update_unit': {
          unitStatusUpdate = effect.status
          break
        }
      }
    }
  }

  const activityEvent: Omit<ActivityEvent, 'id'> = {
    prospectId: prospect.id,
    type: 'status_changed',
    summary: `${prospect.name} moved to "${toStatus}"`,
    timestamp: now.toISOString(),
    previousStatus: prospect.status,
    newStatus: toStatus,
  }

  return { tasksToCreate, taskIdsToClose, unitStatusUpdate, activityEvent }
}

// ---------------------------------------------------------------------------
// Validation schemas — shared form validation using Zod
// ---------------------------------------------------------------------------

import { z } from 'zod'

export const createProspectSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  assignedUnitId: z.string().nullable().optional(),
})

export type CreateProspectInput = z.infer<typeof createProspectSchema>

export const createUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required').min(1, 'Unit name must not be empty'),
  status: z.enum(['available', 'held', 'leased']),
})

export type CreateUnitInput = z.infer<typeof createUnitSchema>

export const transitionProspectSchema = z.object({
  toStatus: z.enum(['new', 'contacted', 'tour_scheduled', 'toured', 'application', 'leased', 'lost']),
})

export type TransitionProspectInput = z.infer<typeof transitionProspectSchema>

export const scheduleTourSchema = z.object({
  prospectId: z.string().uuid('Invalid prospect ID'),
  unitId: z.string().uuid('Invalid unit ID'),
  scheduledTime: z.string().datetime('Invalid date/time'),
})

export type ScheduleTourInput = z.infer<typeof scheduleTourSchema>

export const recordTourOutcomeSchema = z.object({
  outcome: z.enum(['completed', 'no_show', 'cancelled']).nullable(),
})

export type RecordTourOutcomeInput = z.infer<typeof recordTourOutcomeSchema>
