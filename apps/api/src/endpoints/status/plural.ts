import { Router, Request, Response } from "express";
import packageJson from "../../../../../package.json";
import { sendResponse } from "../../utils/http-response";
import { logger } from "../../utils/logger";
import { getOrCreateTraceId } from "../../utils/trace-id";

export const pluralVersionRouter = Router();

// GET /version - Get project version
pluralVersionRouter.get("/", (req: Request, res: Response) => {
  // Keep this endpoint dependency-light so it works as a quick health/version probe.
  const traceId = getOrCreateTraceId(req);

  logger.info("Serving version endpoint", {
    traceId,
    version: packageJson.version,
    name: packageJson.name,
  });

  return sendResponse(res, 200, {
    success: true,
    version: packageJson.version,
    name: packageJson.name,
  });
});
