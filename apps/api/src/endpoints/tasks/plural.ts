import { Router, Request, Response } from "express";
import { store } from "../../database/store";
import { sendResponse } from "../../utils/http-response";

export const pluralTasksRouter = Router();

// GET /tasks?prospectId=...
pluralTasksRouter.get("/", async (req: Request, res: Response) => {
  const { prospectId } = req.query as { prospectId?: string };
  const tasks = await store.listTasks(prospectId);
  return sendResponse(res, 200, {
    success: true,
    data: tasks,
  });
});
