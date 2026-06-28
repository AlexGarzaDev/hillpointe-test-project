import "dotenv/config";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";

const configuredPort = Number(process.env.PORT);
const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3000;

if (process.env.PORT && port === 3000 && process.env.PORT !== "3000") {
  logger.warn("Invalid PORT provided, falling back to 3000", {
    traceId: "startup",
    configuredPort: process.env.PORT,
  });
}
// Shared trace id keeps startup logs grouped together.
const startupTraceId = "startup";

const server = app.listen(port, () => {
  logger.info("Server started", {
    traceId: startupTraceId,
    port,
    url: `http://localhost:${port}`,
  });
});

server.on("error", (error) => {
  logger.error("Server failed to start", {
    traceId: startupTraceId,
    error,
  });
});
