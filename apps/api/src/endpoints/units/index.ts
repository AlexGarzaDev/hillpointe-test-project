import { Router } from "express";
import { pluralUnitsRouter } from "./plural";
import { singularUnitsRouter } from "./singular";

export const unitsRouter = Router();

unitsRouter.use(pluralUnitsRouter);
unitsRouter.use(singularUnitsRouter);
