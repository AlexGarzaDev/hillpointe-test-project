import { Router } from "express";
import { pluralProspectsRouter } from "./plural";
import { singularProspectsRouter } from "./singular";

export const prospectsRouter = Router();

prospectsRouter.use(pluralProspectsRouter);
prospectsRouter.use(singularProspectsRouter);
