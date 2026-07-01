// Re-export the canonical pipeline executor from @hillpointe/shared so that
// any existing imports of this path continue to resolve.
export { applyPipelineTransition } from '@hillpointe/shared'
export type { PipelineTransitionResult } from '@hillpointe/shared'
