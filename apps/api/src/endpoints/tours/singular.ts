import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";
import type { TourOutcome } from "../../types/domain";

export const singularToursRouter = Router();

// GET /tours/:id
singularToursRouter.get("/:id", async (req: Request, res: Response) => {
  const tour = await store.getTour(req.params.id!);
  if (!tour) return sendError(res, 404, "Tour not found");
  return sendResponse(res, 200, { success: true, data: tour });
});

// PATCH /tours/:id — record outcome
singularToursRouter.patch("/:id", async (req: Request, res: Response) => {
  const { outcome } = req.body as { outcome?: TourOutcome };
  const tour = await store.updateTour(req.params.id!, { outcome: outcome ?? null });
  if (!tour) return sendError(res, 404, "Tour not found");
  return sendResponse(res, 200, { success: true, data: tour });
});
