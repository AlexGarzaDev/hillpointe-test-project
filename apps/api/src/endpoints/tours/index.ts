import { Router } from "express";
import { pluralToursRouter } from "./plural";
import { singularToursRouter } from "./singular";

export const toursRouter = Router();

toursRouter.use(pluralToursRouter);
toursRouter.use(singularToursRouter);
