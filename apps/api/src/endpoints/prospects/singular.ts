import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { applyPipelineTransition } from "../../database/pipeline";
import { sendResponse, sendError } from "../../utils/http-response";
import type { ProspectStatus, Task } from "../../types/domain";

export const singularProspectsRouter = Router();

// GET /prospects/:id
singularProspectsRouter.get("/:id", async (req: Request, res: Response) => {
  const prospect = await store.getProspect(req.params.id!);
  if (!prospect) return sendError(res, 404, "Prospect not found");
  return sendResponse(res, 200, { success: true, data: prospect });
});

// PATCH /prospects/:id
singularProspectsRouter.patch("/:id", async (req: Request, res: Response) => {
  const prospect = await store.updateProspect(req.params.id!, req.body);
  if (!prospect) return sendError(res, 404, "Prospect not found");
  return sendResponse(res, 200, { success: true, data: prospect });
});

// POST /prospects/:id/transition
// Body: { toStatus: ProspectStatus }
singularProspectsRouter.post("/:id/transition", async (req: Request, res: Response) => {
  const { toStatus } = req.body as { toStatus?: ProspectStatus };

  if (!toStatus) return sendError(res, 400, "toStatus is required");

  const prospect = await store.getProspect(req.params.id!);
  if (!prospect) return sendError(res, 404, "Prospect not found");

  const allTasks = await store.listTasks(prospect.id);
  const openTasks = allTasks.filter((t: Task) => t.state === "open");
  const nextTour = await store.nextTourForProspect(prospect.id);

  const result = applyPipelineTransition(prospect, toStatus, openTasks, nextTour);

  // Apply mutations
  const createdTasks = await Promise.all(
    result.tasksToCreate.map((t) => store.createTask(t))
  );
  await store.closeOpenTasksForProspect(prospect.id);

  if (result.unitStatusUpdate && prospect.assignedUnitId) {
    await store.updateUnit(prospect.assignedUnitId, { status: result.unitStatusUpdate });
  }

  const activity = await store.appendActivity(result.activityEvent);
  const updatedProspect = await store.updateProspect(prospect.id, { status: toStatus });

  return sendResponse(res, 200, {
    success: true,
    data: {
      prospect: updatedProspect,
      createdTasks,
      activity,
    },
  });
});
