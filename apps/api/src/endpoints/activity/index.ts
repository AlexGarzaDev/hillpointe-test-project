import { Router } from "express";
import { pluralActivityRouter } from "./plural";

export const activityRouter = Router();

activityRouter.use(pluralActivityRouter);
