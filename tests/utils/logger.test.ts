import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T10:30:00.000Z"));
  });

  afterEach(() => {
    stderrSpy.mockRestore();
    vi.useRealTimers();
    vi.resetModules();
  });

  async function importLogger(logLevel = "info") {
    vi.stubEnv("LOG_LEVEL", logLevel);
    const mod = await import("../../src/utils/logger.js");
    return mod.logger;
  }

  function parseOutput(): Record<string, unknown> {
    const raw = stderrSpy.mock.calls[0]?.[0] as string;
    return JSON.parse(raw);
  }

  it("emite JSON estruturado no stderr", async () => {
    const logger = await importLogger();
    logger.info("server started");
    const entry = parseOutput();

    expect(entry).toEqual({
      timestamp: "2025-01-15T10:30:00.000Z",
      level: "info",
      message: "server started",
    });
  });

  it("inclui dados extras no JSON", async () => {
    const logger = await importLogger();
    logger.info("request", { tool: "list_companies", duration: 120 });
    const entry = parseOutput();

    expect(entry.tool).toBe("list_companies");
    expect(entry.duration).toBe(120);
  });

  it("termina cada linha com newline", async () => {
    const logger = await importLogger();
    logger.info("test");
    const raw = stderrSpy.mock.calls[0]?.[0] as string;

    expect(raw.endsWith("\n")).toBe(true);
  });

  it("respeita nivel minimo - debug filtrado quando level=info", async () => {
    const logger = await importLogger("info");
    logger.debug("detalhe");

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("emite warn quando level=info", async () => {
    const logger = await importLogger("info");
    logger.warn("cuidado");
    const entry = parseOutput();

    expect(entry.level).toBe("warn");
  });

  it("emite error quando level=error", async () => {
    const logger = await importLogger("error");
    logger.error("falha");
    const entry = parseOutput();

    expect(entry.level).toBe("error");
  });

  it("filtra warn quando level=error", async () => {
    const logger = await importLogger("error");
    logger.warn("ignorado");

    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it("emite tudo quando level=debug", async () => {
    const logger = await importLogger("debug");
    logger.debug("detalhe");
    logger.info("info");
    logger.warn("aviso");
    logger.error("erro");

    expect(stderrSpy).toHaveBeenCalledTimes(4);
  });

  it("usa info como fallback para nivel invalido", async () => {
    const logger = await importLogger("invalido");
    logger.debug("filtrado");
    logger.info("visivel");

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const entry = parseOutput();
    expect(entry.level).toBe("info");
  });
});
