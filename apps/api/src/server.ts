import "dotenv/config";
import { app } from "./app.js";
import { logger } from "./utils/logger.js";
import { initializeDatabase } from "./database/sequelize.js";

const configuredPort = Number(process.env.PORT);
const port = Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 3000;

if (process.env.PORT && port === 3000 && process.env.PORT !== "3000") {
  logger.warn("Invalid PORT provided, falling back to 3000", {
    traceId: "startup",
    configuredPort: process.env.PORT,
  });
}

const startupTraceId = "startup";

async function start() {
  try {
    // Establish database connectivity and model sync before accepting traffic.
    await initializeDatabase();

    // Boot HTTP listener only after dependencies are ready.
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

    // Handle orchestrator/container shutdown requests without dropping logs abruptly.
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM received, shutting down gracefully", {
        traceId: "shutdown",
      });
      server.close(() => {
        logger.info("Server closed", { traceId: "shutdown" });
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start application", {
      traceId: startupTraceId,
      error,
    });
    process.exit(1);
  }
}

start();
