import { Router } from "express";
import { pluralTasksRouter } from "./plural";
import { singularTasksRouter } from "./singular";

export const tasksRouter = Router();

tasksRouter.use(pluralTasksRouter);
tasksRouter.use(singularTasksRouter);
