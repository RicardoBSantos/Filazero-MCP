import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { isRecord } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  accessKey: z.string().describe("Chave publica de acesso ao ticket"),
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
  timeStyle: "medium",
});

const DATE_KEYS = ["createdAt", "updatedAt", "scheduledAt", "calledAt", "completedAt", "cancelledAt", "startDate", "endDate"];

function convertDates(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (DATE_KEYS.includes(key) && typeof value === "string") {
      const parsed = new Date(value);
      result[key] = isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export const checkTicketStatus: ToolDefinition<typeof schema> = {
  name: "check_ticket_status",
  description:
    "Consulta o status publico de um ticket (senha/agendamento) na plataforma Filazero usando a chave de acesso.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      accessKey: { type: "string", description: "Chave publica de acesso ao ticket" },
    },
    required: ["accessKey"],
  },
  async execute(args) {
    try {
      const response = await filazeroClient.get("/v2/ticketing/public/ticket", {
        params: { key: args.accessKey },
      });

      const data = response.data;
      const ticket = isRecord(data) && isRecord(data.data) ? data.data : data;

      if (!isRecord(ticket)) {
        throw new Error("Resposta inesperada da API ao consultar ticket.");
      }

      return toolSuccess(convertDates(ticket));
    } catch (error) {
      throw new Error(`Falha ao consultar ticket: ${formatErrorMessage(error)}`);
    }
  },
};
