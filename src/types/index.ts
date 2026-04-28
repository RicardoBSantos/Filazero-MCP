import { z } from "zod";

export type NormalizedCompany = {
  id: string | number;
  slug: string;
  name: string;
};

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

export function toolSuccess(data: unknown): ToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export type ToolDefinition<TSchema extends z.ZodTypeAny> = {
  name: string;
  description: string;
  schema: TSchema;
  inputSchema: object;
  execute: (args: z.infer<TSchema>, bearerToken?: string) => Promise<ToolResult>;
};
