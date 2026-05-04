import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { checkAndExtract } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  slug: z.string().describe("Slug da empresa"),
  serviceId: z.number().describe("ID do servico retornado por get_company_services"),
  year: z.number().describe("Ano (ex: 2026)"),
  month: z.number().describe("Mes (1-12)"),
});

export const getAvailableDates: ToolDefinition<typeof schema> = {
  name: "get_available_dates",
  description:
    "Retorna os dias com sessoes disponiveis para agendamento de um servico Filazero em determinado mes/ano.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "Slug da empresa" },
      serviceId: { type: "number", description: "ID do servico retornado por get_company_services" },
      year: { type: "number", description: "Ano (ex: 2026)" },
      month: { type: "number", description: "Mes (1-12)" },
    },
    required: ["slug", "serviceId", "year", "month"],
  },
  async execute(args) {
    try {
      const response = await filazeroClient.get(
        `/v2/scheduling/self-service/providers/${args.slug}/services/${args.serviceId}/available-session-days`,
        { params: { year: args.year, month: args.month } },
      );
      const days = checkAndExtract(response.data, ["days", "availableDays", "sessions"]);

      return toolSuccess({
        slug: args.slug,
        serviceId: args.serviceId,
        year: args.year,
        month: args.month,
        availableDays: days,
        nextToolHint: "Use uma data retornada (campo data) na tool get_available_sessions.",
      });
    } catch (error) {
      throw new Error(`Falha ao buscar datas disponiveis: ${formatErrorMessage(error)}`);
    }
  },
};
