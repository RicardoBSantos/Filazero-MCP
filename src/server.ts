import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { ToolDefinition } from "./types/index.js";
import { ALL_TOOLS } from "./tools/index.js";
import { RESOURCES, RESOURCE_CONTENTS } from "./resources/index.js";
import { PROMPTS, getPromptMessages } from "./prompts/index.js";
import { formatErrorMessage } from "./utils/errors.js";
import { logger } from "./utils/logger.js";

function createServer(): Server {
  const server = new Server(
    {
      name: "Filazero-MCP-Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: ALL_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const tool = ALL_TOOLS.find((t) => t.name === name) as ToolDefinition<z.ZodTypeAny> | undefined;
    if (!tool) {
      throw new Error(`Ferramenta desconhecida: ${name}`);
    }

    try {
      const parsed = tool.schema.parse(args ?? {});
      return await tool.execute(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Parametros invalidos para ${name}: ${error.errors.map((e) => e.message).join(", ")}`,
        );
      }
      throw new Error(`Falha ao executar ${name}: ${formatErrorMessage(error)}`);
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: [...RESOURCES] };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = RESOURCE_CONTENTS[uri];

    if (!content) {
      throw new Error(`Recurso desconhecido: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(content, null, 2),
        },
      ],
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: [...PROMPTS] };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const prompt = PROMPTS.find((p) => p.name === name);
    if (!prompt) {
      throw new Error(`Prompt desconhecido: ${name}`);
    }

    const messages = getPromptMessages(name, (args as Record<string, string>) ?? {});
    return { messages };
  });

  return server;
}

export async function run(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("mcp_server_started", { transport: "stdio" });
}
