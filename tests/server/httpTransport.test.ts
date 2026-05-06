import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock logger before importing server
vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock MCP SDK transports
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(function () {
    return {};
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn(function () {
    return {
      handleRequest: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };
  }),
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

describe("HTTP Transport (server.ts)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("selects stdio transport by default", async () => {
    delete process.env.MCP_TRANSPORT;
    const { run } = await import("../../src/server.js");
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );

    await run();
    expect(StdioServerTransport).toHaveBeenCalled();
  });

  it("selects http transport when MCP_TRANSPORT=http", async () => {
    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_HTTP_PORT = "0";

    const mockListen = vi.fn((_port: number, _host: string, cb: () => void) => {
      cb();
      return { close: vi.fn() };
    });
    const mockJsonMiddleware = vi.fn();
    const mockApp = {
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      listen: mockListen,
    };

    const expressFn: any = () => mockApp;
    expressFn.json = () => mockJsonMiddleware;

    vi.doMock("express", () => ({
      default: expressFn,
    }));

    const { run } = await import("../../src/server.js");
    await run();

    expect(mockListen).toHaveBeenCalled();
    expect(mockApp.post).toHaveBeenCalledWith("/mcp", expect.any(Function));
    expect(mockApp.get).toHaveBeenCalledWith("/health", expect.any(Function));
  });
});
