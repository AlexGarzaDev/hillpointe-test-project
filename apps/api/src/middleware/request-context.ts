import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { getOrCreateTraceId, TRACE_ID_HEADER } from "../utils/trace-id";

export function attachRequestContext(req: Request, res: Response, next: NextFunction): void {
  const traceId = getOrCreateTraceId(req);
  const startedAt = process.hrtime.bigint();

  // Trace id in the response so clients can correlate logs and requests.
  res.setHeader(TRACE_ID_HEADER, traceId);

  logger.info("Incoming request", {
    traceId,
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    // Monotonic clock for request duration to avoid drift.
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info("Request completed", {
      traceId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    });
  });

  next();
}
