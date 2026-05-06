import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
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

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: vi.fn(function () {
    return {
      handleRequest: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };
  }),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(function () {
    return {};
  }),
}));

/**
 * Test HTTP route handlers by extracting them from express mock
 */
describe("HTTP Route Handlers", () => {
  let routes: Record<string, Record<string, Function>>;
  let middlewares: Function[];
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockRes: { json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn>; headersSent: boolean; on: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.resetModules();
    routes = { get: {}, post: {}, delete: {} };
    middlewares = [];
    mockJson = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson }));
    mockRes = {
      json: mockJson,
      status: mockStatus,
      headersSent: false,
      on: vi.fn(),
    };
  });

  async function setupRoutes() {
    const mockListen = vi.fn((_port: number, _host: string, cb: () => void) => {
      cb();
      return { close: vi.fn() };
    });

    const mockApp = {
      use: vi.fn((handler: Function) => {
        middlewares.push(handler);
      }),
      get: vi.fn((path: string, handler: Function) => {
        routes.get[path] = handler;
      }),
      post: vi.fn((path: string, handler: Function) => {
        routes.post[path] = handler;
      }),
      delete: vi.fn((path: string, handler: Function) => {
        routes.delete[path] = handler;
      }),
      listen: mockListen,
    };

    const expressFn = Object.assign(() => mockApp, { json: () => vi.fn() });

    vi.doMock("express", () => ({
      default: expressFn,
    }));

    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_HTTP_PORT = "0";

    const { run } = await import("../../src/server.js");
    await run();
    return mockApp;
  }

  it("GET /health returns status ok", async () => {
    await setupRoutes();
    const handler = routes.get["/health"];
    expect(handler).toBeDefined();

    handler({}, mockRes);
    expect(mockJson).toHaveBeenCalledWith({
      status: "ok",
      transport: "streamable-http",
    });
  });

  it("GET /mcp returns 405 Method not allowed", async () => {
    await setupRoutes();
    const handler = routes.get["/mcp"];
    expect(handler).toBeDefined();

    handler({}, mockRes);
    expect(mockStatus).toHaveBeenCalledWith(405);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: "2.0",
        error: expect.objectContaining({ code: -32000 }),
      }),
    );
  });

  it("DELETE /mcp returns 405", async () => {
    await setupRoutes();
    const handler = routes.delete["/mcp"];
    expect(handler).toBeDefined();

    handler({}, mockRes);
    expect(mockStatus).toHaveBeenCalledWith(405);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: "2.0",
        error: expect.objectContaining({ code: -32000 }),
      }),
    );
  });

  it("POST /mcp calls StreamableHTTPServerTransport.handleRequest", async () => {
    await setupRoutes();
    const handler = routes.post["/mcp"];
    expect(handler).toBeDefined();

    const mockReq = { body: { jsonrpc: "2.0", method: "initialize", id: 1 } };
    await handler(mockReq, mockRes);

    const { StreamableHTTPServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/streamableHttp.js"
    );
    expect(StreamableHTTPServerTransport).toHaveBeenCalled();
  });

  it("POST /mcp returns 500 on transport error", async () => {
    // Re-mock with throwing handleRequest
    vi.doMock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
      StreamableHTTPServerTransport: vi.fn(function () {
        return {
          handleRequest: vi.fn().mockRejectedValue(new Error("transport fail")),
          close: vi.fn(),
        };
      }),
    }));

    vi.resetModules();
    routes = { get: {}, post: {}, delete: {} };

    const mockListen2 = vi.fn((_port: number, _host: string, cb: () => void) => {
      cb();
      return { close: vi.fn() };
    });
    const mockApp2 = {
      use: vi.fn(),
      get: vi.fn((path: string, handler: Function) => { routes.get[path] = handler; }),
      post: vi.fn((path: string, handler: Function) => { routes.post[path] = handler; }),
      delete: vi.fn((path: string, handler: Function) => { routes.delete[path] = handler; }),
      listen: mockListen2,
    };
    const expressFn2 = Object.assign(() => mockApp2, { json: () => vi.fn() });
    vi.doMock("express", () => ({ default: expressFn2 }));

    // Re-mock Server for this scope
    vi.doMock("@modelcontextprotocol/sdk/server/index.js", () => ({
      Server: vi.fn(function () {
        return {
          connect: vi.fn().mockResolvedValue(undefined),
          close: vi.fn(),
          setRequestHandler: vi.fn(),
        };
      }),
    }));

    process.env.MCP_TRANSPORT = "http";
    process.env.MCP_HTTP_PORT = "0";

    const { run } = await import("../../src/server.js");
    await run();

    const handler = routes.post["/mcp"];
    const mockReq = { body: {} };
    const errorRes = {
      json: vi.fn(),
      status: vi.fn(() => ({ json: vi.fn() })),
      headersSent: false,
      on: vi.fn(),
    };

    await handler(mockReq, errorRes);
    expect(errorRes.status).toHaveBeenCalledWith(500);
  });

  it("404 handler registered via app.use", async () => {
    await setupRoutes();
    // Last middleware registered via app.use should be 404 handler
    const notFoundHandler = middlewares[middlewares.length - 1];
    expect(notFoundHandler).toBeDefined();

    notFoundHandler({}, mockRes);
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({ error: "Not found" });
  });
});
