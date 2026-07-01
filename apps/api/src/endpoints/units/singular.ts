import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";

export const singularUnitsRouter = Router();

// GET /units/:id
singularUnitsRouter.get("/:id", async (req: Request, res: Response) => {
  const unit = await store.getUnit(req.params.id!);
  if (!unit) return sendError(res, 404, "Unit not found");
  return sendResponse(res, 200, { success: true, data: unit });
});

// PATCH /units/:id
singularUnitsRouter.patch("/:id", async (req: Request, res: Response) => {
  const unit = await store.updateUnit(req.params.id!, req.body);
  if (!unit) return sendError(res, 404, "Unit not found");
  return sendResponse(res, 200, { success: true, data: unit });
});

// DELETE /units/:id
singularUnitsRouter.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await store.deleteUnit(req.params.id!);
  if (!deleted) return sendError(res, 404, "Unit not found");
  return sendResponse(res, 200, { success: true, data: null });
});
