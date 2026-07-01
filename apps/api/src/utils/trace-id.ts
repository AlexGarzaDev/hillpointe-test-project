import { randomUUID } from "node:crypto";
import { Request } from "express";

// Shared header key used for inbound and outbound request correlation.
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
  // Re-use value already attached by middleware/previous call in same request.
  if (req.traceId) {
    return req.traceId;
  }

  const rawHeaderValue = req.headers[TRACE_ID_HEADER];
  const headerValue = Array.isArray(rawHeaderValue) ? rawHeaderValue[0] : rawHeaderValue;
  // Prefer client-provided trace id for distributed tracing, otherwise generate.
  const traceId = normalizeTraceId(headerValue) ?? randomUUID();

  req.traceId = traceId;
  return traceId;
}