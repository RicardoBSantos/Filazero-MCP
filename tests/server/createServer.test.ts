import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/utils/logger.js", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSetRequestHandler = vi.fn();
const MockServer = vi.fn(function () {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    setRequestHandler: mockSetRequestHandler,
  };
});

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: MockServer,
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

describe("createServer", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSetRequestHandler.mockClear();
    MockServer.mockClear();
  });

  it("registers 6 request handlers (tools, resources, prompts)", async () => {
    delete process.env.MCP_TRANSPORT;

    const { run } = await import("../../src/server.js");
    await run();

    // ListTools, CallTool, ListResources, ReadResource, ListPrompts, GetPrompt
    expect(mockSetRequestHandler).toHaveBeenCalledTimes(6);
  });

  it("creates server with correct name and version", async () => {
    delete process.env.MCP_TRANSPORT;

    const { run } = await import("../../src/server.js");
    await run();

    expect(MockServer).toHaveBeenCalledWith(
      { name: "Filazero-MCP-Server", version: "1.0.0" },
      expect.objectContaining({
        capabilities: { tools: {}, resources: {}, prompts: {} },
      }),
    );
  });
});
