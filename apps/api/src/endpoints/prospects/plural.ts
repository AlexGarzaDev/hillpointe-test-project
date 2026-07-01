import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse, sendError } from "../../utils/http-response";

export const pluralProspectsRouter = Router();

// GET /prospects
pluralProspectsRouter.get("/", async (_req: Request, res: Response) => {
  const prospects = await store.listProspects();
  return sendResponse(res, 200, { success: true, data: prospects });
});

// POST /prospects
pluralProspectsRouter.post("/", async (req: Request, res: Response) => {
  const { name, email, phone, assignedUnitId } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    assignedUnitId?: string | null;
  };
  if (!name) return sendError(res, 400, "name is required");
  if (!email) return sendError(res, 400, "email is required");
  const prospect = await store.createProspect({
    name,
    email,
    phone: phone ?? null,
    assignedUnitId: assignedUnitId ?? null,
  });
  return sendResponse(res, 201, { success: true, data: prospect });
});

// DELETE /prospects/:id
pluralProspectsRouter.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await store.deleteProspect(req.params.id!);
  if (!deleted) return sendError(res, 404, "Prospect not found");
  return sendResponse(res, 200, { success: true, data: null });
});
