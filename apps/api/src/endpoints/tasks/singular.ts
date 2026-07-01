import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";
import type { TaskState } from "../../types/domain";

export const singularTasksRouter = Router();

// GET /tasks/:id
singularTasksRouter.get("/:id", async (req: Request, res: Response) => {
  const task = await store.getTask(req.params.id!);
  if (!task) return sendError(res, 404, "Task not found");
  return sendResponse(res, 200, { success: true, data: task });
});

// PATCH /tasks/:id — update state (open → done or back)
singularTasksRouter.patch("/:id", async (req: Request, res: Response) => {
  const { state } = req.body as { state?: TaskState };
  if (!state) return sendError(res, 400, "state is required");

  // This endpoint only updates mutable task fields; immutable identifiers remain stable.
  const task = await store.updateTask(req.params.id!, { state });
  if (!task) return sendError(res, 404, "Task not found");
  return sendResponse(res, 200, { success: true, data: task });
});
