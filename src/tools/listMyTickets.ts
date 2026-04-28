import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { checkAndExtract } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  bearerToken: z.string().describe("Token de autenticacao do usuario"),
});

export const listMyTickets: ToolDefinition<typeof schema> = {
  name: "list_my_tickets",
  description:
    "Lista os tickets (senhas/agendamentos) do usuario autenticado na plataforma Filazero.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      bearerToken: { type: "string", description: "Token de autenticacao do usuario" },
    },
    required: ["bearerToken"],
  },
  async execute(args) {
    try {
      const response = await filazeroClient.get("/v2/ticketing/me/filtered-tickets", {
        headers: {
          Authorization: `Bearer ${args.bearerToken}`,
        },
      });
      const tickets = checkAndExtract(response.data, ["tickets", "data"]);

      return toolSuccess({ tickets });
    } catch (error) {
      throw new Error(`Falha ao listar tickets do usuario: ${formatErrorMessage(error)}`);
    }
  },
};
