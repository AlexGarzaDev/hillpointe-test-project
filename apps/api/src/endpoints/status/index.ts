import { Router } from "express";
import { pluralVersionRouter } from "./plural";

export const versionRouter = Router();

versionRouter.use(pluralVersionRouter);
