import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { existsSync } from "node:fs";
import { versionRouter, unitsRouter, prospectsRouter, toursRouter, tasksRouter, activityRouter } from "./endpoints";
import { sendError } from "./utils/http-response";
import { logger } from "./utils/logger";
import { attachRequestContext } from "./middleware/request-context";
import { getOrCreateTraceId } from "./utils/trace-id";

// Express app composition for both API endpoints and optional static web serving.
export const app = express();

// Global middleware order matters: security headers, CORS, JSON body parsing,
// then request-scoped tracing/logging for all downstream handlers.
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

// API route mounts. Each router encapsulates resource-specific CRUD + actions.
app.use("/version", versionRouter);
app.use("/units", unitsRouter);
app.use("/prospects", prospectsRouter);
app.use("/tours", toursRouter);
app.use("/tasks", tasksRouter);
app.use("/activity", activityRouter);

// Support the frontend's `/api` prefix as a stable deployment-friendly alias.
app.use("/api/version", versionRouter);
app.use("/api/units", unitsRouter);
app.use("/api/prospects", prospectsRouter);
app.use("/api/tours", toursRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/activity", activityRouter);

const frontendDistPath = path.resolve(__dirname, "../../web/dist");
const frontendEntryPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = existsSync(frontendEntryPath);
const shouldServeFrontend = hasFrontendBuild && process.env.NODE_ENV !== "test";

// In development/test without a built frontend, API still runs standalone.
if (shouldServeFrontend) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    // Keep API paths out of SPA fallback so missing API routes still become 404s.
    const apiPaths = [
      "/version",
      "/units",
      "/prospects",
      "/tours",
      "/tasks",
      "/activity",
      "/api/version",
      "/api/units",
      "/api/prospects",
      "/api/tours",
      "/api/tasks",
      "/api/activity",
    ];
    if (apiPaths.some((p) => req.path.startsWith(p))) {
      next();
      return;
    }

    res.sendFile(frontendEntryPath);
  });
}

// Final fallback when no route matches above.
app.use((req, res) => {
  const traceId = getOrCreateTraceId(req);

  logger.warn("Route not found", {
    traceId,
    method: req.method,
    path: req.originalUrl,
  });

  sendError(res, 404, "Not Found");
});
