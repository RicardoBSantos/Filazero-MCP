import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { Cache } from "../cache/index.js";
import { checkAndExtract } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  providerId: z.number().describe("ID do provider/empresa"),
  sessionId: z.number().describe("ID da sessao retornado por get_available_sessions"),
});

export const formCache = new Cache<unknown[]>();

export const getBookingForm: ToolDefinition<typeof schema> = {
  name: "get_booking_form",
  description:
    "Retorna os campos customizados (formulario) necessarios para realizar um agendamento em uma sessao Filazero.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      providerId: { type: "number", description: "ID do provider/empresa" },
      sessionId: { type: "number", description: "ID da sessao retornado por get_available_sessions" },
    },
    required: ["providerId", "sessionId"],
  },
  async execute(args) {
    try {
      const cacheKey = `form:${args.providerId}:${args.sessionId}`;
      const cached = formCache.get(cacheKey);
      if (cached) {
        return toolSuccess({
          providerId: args.providerId,
          sessionId: args.sessionId,
          customFields: cached,
          nextToolHint: "Preencha os campos retornados e use na tool schedule_appointment.",
        });
      }

      const response = await filazeroClient.get(
        `/api/providers/${args.providerId}/sessions/${args.sessionId}/custom-fields`,
      );
      const fields = checkAndExtract(response.data, ["customFields", "fields"]);

      formCache.set(cacheKey, fields, 600);

      return toolSuccess({
        providerId: args.providerId,
        sessionId: args.sessionId,
        customFields: fields,
        nextToolHint: "Preencha os campos retornados e use na tool schedule_appointment.",
      });
    } catch (error) {
      throw new Error(`Falha ao buscar formulario da sessao ${args.sessionId}: ${formatErrorMessage(error)}`);
    }
  },
};
