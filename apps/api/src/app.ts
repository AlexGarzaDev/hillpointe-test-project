import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { existsSync } from "node:fs";
import { versionRouter } from "./endpoints";
import { sendError } from "./utils/http-response";
import { logger } from "./utils/logger";
import { attachRequestContext } from "./middleware/request-context";
import { getOrCreateTraceId } from "./utils/trace-id";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(attachRequestContext);

app.use("/version", versionRouter);

const frontendDistPath = path.resolve(__dirname, "../../web/dist");
const frontendEntryPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = existsSync(frontendEntryPath);
const shouldServeFrontend = hasFrontendBuild && process.env.NODE_ENV !== "test";

if (shouldServeFrontend) {
  app.use(express.static(frontendDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/version")) {
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
