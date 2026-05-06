import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: vi.fn(function () {
    return {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      setRequestHandler: vi.fn(),
    };
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(function () {
    return {};
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn(function () {
    return { handleRequest: vi.fn(), close: vi.fn() };
  }),
}));

describe("Server startup performance", () => {
  it("initializes in less than 3 seconds (stdio)", async () => {
    delete process.env.MCP_TRANSPORT;

    const start = performance.now();
    const { run } = await import("../../src/server.js");
    await run();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  it("initializes in less than 3 seconds (http)", async () => {
    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_HTTP_PORT = "0";

    const expressFn = Object.assign(() => ({
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      listen: vi.fn((_p: number, _h: string, cb: () => void) => {
        cb();
        return { close: vi.fn() };
      }),
    }), { json: () => vi.fn() });

    vi.doMock("express", () => ({ default: expressFn }));
    vi.resetModules();

    const start = performance.now();
    const { run } = await import("../../src/server.js");
    await run();
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(3000);

    delete process.env.MCP_TRANSPORT;
  });
});
