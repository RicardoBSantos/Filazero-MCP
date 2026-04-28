import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { checkAndExtract } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  slug: z.string().describe("Slug da empresa"),
  locationId: z.number().describe("ID da unidade/local"),
  serviceId: z.number().describe("ID do servico retornado por get_company_services"),
  date: z.string().describe("Data no formato YYYY-MM-DD"),
});

export const getAvailableSessions: ToolDefinition<typeof schema> = {
  name: "get_available_sessions",
  description:
    "Retorna as sessoes e recursos disponiveis para agendamento em uma data especifica de um servico Filazero.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "Slug da empresa" },
      locationId: { type: "number", description: "ID da unidade/local" },
      serviceId: { type: "number", description: "ID do servico retornado por get_company_services" },
      date: { type: "string", description: "Data no formato YYYY-MM-DD" },
    },
    required: ["slug", "locationId", "serviceId", "date"],
  },
  async execute(args) {
    try {
      const response = await filazeroClient.get(
        `/v2/scheduling/self-service/providers/${args.slug}/locations/${args.locationId}/services/${args.serviceId}/sessions-resources-by-service`,
        { params: { date: args.date } },
      );
      const sessions = checkAndExtract(response.data, ["sessions", "resources", "slots"]);

      return toolSuccess({
        slug: args.slug,
        locationId: args.locationId,
        serviceId: args.serviceId,
        date: args.date,
        sessions,
        nextToolHint: "Use sessionId e resourceId na tool create_appointment.",
      });
    } catch (error) {
      throw new Error(`Falha ao buscar sessoes disponiveis para ${args.date}: ${formatErrorMessage(error)}`);
    }
  },
};
