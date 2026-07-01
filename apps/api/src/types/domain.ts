// Re-export canonical types from the shared contracts package.
// Both API and web import from @hillpointe/shared — this file is a
// convenience facade so existing relative imports within the API continue to work.
export type {
  UnitStatus,
  Unit,
  ProspectStatus,
  Prospect,
  TourOutcome,
  Tour,
  TaskState,
  Task,
  ActivityEvent,
  PipelineTransitionResult,
  PipelineRule,
  RuleEffect,
  CreateTaskEffect,
  CloseOpenTasksEffect,
  UpdateUnitStatusEffect,
} from "@hillpointe/shared";
export { PIPELINE_RULES, applyPipelineTransition } from "@hillpointe/shared";
