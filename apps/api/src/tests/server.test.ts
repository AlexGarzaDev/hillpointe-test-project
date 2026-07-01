import { app } from "../app";
import { logger } from "../utils/logger";
import * as sequelizeModule from "../database/sequelize";

describe("server bootstrap", () => {
  const originalPort = process.env.PORT;

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.PORT = originalPort;
  });

  it("starts on configured port and logs startup plus server errors", async () => {
    const onMock = jest.fn();
    const listenSpy = jest.spyOn(app, "listen").mockImplementation(((port: number, callback?: () => void) => {
      callback?.();
      return { on: onMock } as never;
    }) as never);
    const initializeSpy = jest
      .spyOn(sequelizeModule, "initializeDatabase")
      .mockResolvedValue(undefined);
    const infoSpy = jest.spyOn(logger, "info").mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => undefined);

    process.env.PORT = "4321";

    const serverModulePath = require.resolve("../server");
    delete require.cache[serverModulePath];
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(serverModulePath);

    // Server startup is async because database init is awaited first.
    await Promise.resolve();

    expect(initializeSpy).toHaveBeenCalledTimes(1);

    expect(listenSpy).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(infoSpy).toHaveBeenCalledWith(
      "Server started",
      expect.objectContaining({
        traceId: "startup",
        port: 4321,
        url: "http://localhost:4321",
      })
    );

    const errorHandler = onMock.mock.calls.find((call) => call[0] === "error")?.[1] as
      | ((error: Error) => void)
      | undefined;

    expect(errorHandler).toBeDefined();

    const startupError = new Error("port in use");
    errorHandler?.(startupError);

    expect(errorSpy).toHaveBeenCalledWith(
      "Server failed to start",
      expect.objectContaining({
        traceId: "startup",
        error: startupError,
      })
    );
  });
});
