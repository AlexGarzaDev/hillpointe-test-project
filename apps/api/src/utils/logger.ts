type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = {
  traceId?: string;
  [key: string]: unknown;
};

function shouldSkipLogging(): boolean {
  return process.env.NODE_ENV === "test" && process.env.ENABLE_TEST_LOGS !== "true";
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return error;
}

function writeLog(level: LogLevel, message: string, meta: LogMeta = {}): void {
  if (shouldSkipLogging()) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId: meta.traceId ?? "n/a",
    ...meta,
  };

  const loggerMethod =
    level === "error" ? console.error : level === "warn" ? console.warn : level === "debug" ? console.debug : console.log;

  loggerMethod(JSON.stringify(payload));
}

export const logger = {
  debug(message: string, meta?: LogMeta): void {
    writeLog("debug", message, meta);
  },

  info(message: string, meta?: LogMeta): void {
    writeLog("info", message, meta);
  },

  warn(message: string, meta?: LogMeta): void {
    writeLog("warn", message, meta);
  },

  error(message: string, meta?: LogMeta & { error?: unknown }): void {
    const preparedMeta: LogMeta = meta ? { ...meta } : {};

    if (preparedMeta.error !== undefined) {
      preparedMeta.error = serializeError(preparedMeta.error);
    }

    writeLog("error", message, preparedMeta);
  },
};