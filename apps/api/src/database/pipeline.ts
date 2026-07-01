// Re-export the canonical pipeline executor from the shared contracts package.
// The singular transition endpoint imports applyPipelineTransition from here.
export {
  applyPipelineTransition,
  PIPELINE_RULES,
} from "../types/domain.js";
export type { PipelineTransitionResult as TransitionResult } from "../types/domain.js";
