import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse } from "../../utils/http-response";

export const pluralActivityRouter = Router();

// GET /activity?prospectId=...
pluralActivityRouter.get("/", async (req: Request, res: Response) => {
  const { prospectId } = req.query as { prospectId?: string };
  const activity = await store.listActivity(prospectId);
  return sendResponse(res, 200, {
    success: true,
    data: activity,
  });
});
