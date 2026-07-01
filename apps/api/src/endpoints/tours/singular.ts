import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";
import { applyPipelineTransition } from "../../database/pipeline";
import type { TourOutcome, ProspectStatus, Task } from "../../types/domain";

export const singularToursRouter = Router();

// GET /tours/:id
singularToursRouter.get("/:id", async (req: Request, res: Response) => {
  const tour = await store.getTour(req.params.id!);
  if (!tour) return sendError(res, 404, "Tour not found");
  return sendResponse(res, 200, { success: true, data: tour });
});

// PATCH /tours/:id — record outcome (Tier-1 rules: outcome triggers status transition)
singularToursRouter.patch("/:id", async (req: Request, res: Response) => {
  const { outcome } = req.body as { outcome?: TourOutcome };
  const tour = await store.getTour(req.params.id!);
  if (!tour) return sendError(res, 404, "Tour not found");

  // Persist outcome first so transition logic sees current tour state.
  const updatedTour = await store.updateTour(req.params.id!, { outcome: outcome ?? null });

  // Tier-1 rules: tour outcomes map directly to next pipeline status.
  let nextStatus: ProspectStatus | null = null;
  if (outcome === "completed") {
    nextStatus = "toured";
  } else if (outcome === "no_show" || outcome === "cancelled") {
    nextStatus = "lost";
  }

  // If outcome implies movement in pipeline, apply the shared transition executor.
  if (nextStatus) {
    const prospect = await store.getProspect(tour.prospectId);
    if (prospect && prospect.status !== nextStatus) {
      const openTasks = await store.listTasks(prospect.id);
      const filteredTasks = openTasks.filter((t: Task) => t.state === "open");
      const nextTour = await store.nextTourForProspect(prospect.id);

      const result = applyPipelineTransition(prospect, nextStatus, filteredTasks, nextTour);

      // Mirror the same side-effect order used in /prospects/:id/transition.
      await Promise.all(
        result.tasksToCreate.map((t) => store.createTask(t))
      );
      if (result.taskIdsToClose.length > 0) {
        await store.closeOpenTasksForProspect(prospect.id);
      }

      if (result.unitStatusUpdate && prospect.assignedUnitId) {
        await store.updateUnit(prospect.assignedUnitId, { status: result.unitStatusUpdate });
      }

      await store.appendActivity(result.activityEvent);
      await store.updateProspect(prospect.id, { status: nextStatus });
    }
  }

  return sendResponse(res, 200, { success: true, data: updatedTour });
});
