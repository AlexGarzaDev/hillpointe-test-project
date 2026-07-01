import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";

export const pluralUnitsRouter = Router();

// GET /units
pluralUnitsRouter.get("/", async (_req: Request, res: Response) => {
  const units = await store.listUnits();
  return sendResponse(res, 200, { success: true, data: units });
});

// POST /units
pluralUnitsRouter.post("/", async (req: Request, res: Response) => {
  const { name, status } = req.body as { name?: string; status?: string };
  if (!name) return sendError(res, 400, "name is required");
  const unit = await store.createUnit({
    name,
    status: (status as "available" | "held" | "leased") ?? "available",
  });
  return sendResponse(res, 201, { success: true, data: unit });
});
