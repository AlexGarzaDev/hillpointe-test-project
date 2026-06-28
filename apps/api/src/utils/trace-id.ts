import { randomUUID } from "node:crypto";
import { Request } from "express";

export const TRACE_ID_HEADER = "x-trace-id";

function normalizeTraceId(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  // Treat empty or whitespace-only values as missing.
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function getOrCreateTraceId(req: Request): string {
  if (req.traceId) {
    return req.traceId;
  }

  const rawHeaderValue = req.headers[TRACE_ID_HEADER];
  const headerValue = Array.isArray(rawHeaderValue) ? rawHeaderValue[0] : rawHeaderValue;
  const traceId = normalizeTraceId(headerValue) ?? randomUUID();

  req.traceId = traceId;
  return traceId;
}