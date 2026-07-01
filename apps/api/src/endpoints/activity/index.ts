import { Router } from "express";
import { pluralActivityRouter } from "./plural";
import { singularActivityRouter } from "./singular";

export const activityRouter = Router();

activityRouter.use(pluralActivityRouter);
activityRouter.use(singularActivityRouter);
