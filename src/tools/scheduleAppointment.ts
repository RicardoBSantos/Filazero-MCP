import { z } from "zod";
import { filazeroClient, writeHeaders } from "../http/filazeroClient.js";
import { isRecord } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  bearerToken: z.string().describe("Token de autenticacao do usuario"),
}).passthrough();

export const scheduleAppointment: ToolDefinition<typeof schema> = {
  name: "schedule_appointment",
  description:
    "Cria um agendamento (ticket) na plataforma Filazero. Requer bearerToken e os campos do formulario retornados por get_booking_form.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      bearerToken: { type: "string", description: "Token de autenticacao do usuario" },
    },
    required: ["bearerToken"],
    additionalProperties: true,
  },
  async execute(args) {
    try {
      const { bearerToken, ...body } = args;

      const response = await filazeroClient.post(
        "/v2/ticketing/tickets",
        body,
        {
          headers: {
            ...writeHeaders,
            Authorization: `Bearer ${bearerToken}`,
          },
        },
      );

      const data = response.data;
      const ticket = isRecord(data) && isRecord(data.data) ? data.data : data;

      return toolSuccess({
        ticketId: isRecord(ticket) ? (ticket.id ?? ticket.ticketId ?? null) : null,
        status: isRecord(ticket) ? (ticket.status ?? "scheduled") : "scheduled",
        message: "Agendamento criado com sucesso.",
      });
    } catch (error) {
      throw new Error(`Falha ao criar agendamento: ${formatErrorMessage(error)}`);
    }
  },
};
