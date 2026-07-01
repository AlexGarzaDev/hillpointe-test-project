import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";

export const pluralToursRouter = Router();

// GET /tours
pluralToursRouter.get("/", async (_req: Request, res: Response) => {
  const tours = await store.listTours();
  return sendResponse(res, 200, { success: true, data: tours });
});

// POST /tours
pluralToursRouter.post("/", async (req: Request, res: Response) => {
  const { prospectId, unitId, scheduledTime } = req.body as {
    prospectId?: string;
    unitId?: string;
    scheduledTime?: string;
  };
  if (!prospectId) return sendError(res, 400, "prospectId is required");
  if (!unitId) return sendError(res, 400, "unitId is required");
  if (!scheduledTime) return sendError(res, 400, "scheduledTime is required");

  // Referential checks ensure we fail fast with clear 404s before writing.
  if (!(await store.getProspect(prospectId))) return sendError(res, 404, "Prospect not found");
  if (!(await store.getUnit(unitId))) return sendError(res, 404, "Unit not found");

  // Check for double-booking
  const conflict = await store.checkTourConflict(unitId, scheduledTime);
  if (conflict) return sendError(res, 409, "Unit is already booked for that time");

  // Outcome starts as null and is later recorded via PATCH /tours/:id.
  const tour = await store.createTour({ prospectId, unitId, scheduledTime });
  return sendResponse(res, 201, { success: true, data: tour });
});
