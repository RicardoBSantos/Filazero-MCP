import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { Cache } from "../cache/index.js";
import { checkAndExtract, isRecord, resolveServiceId } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({
  slug: z.string().describe("Slug da empresa retornado por list_companies"),
});

type NormalizedService = {
  rawId: number | null;
  serviceId: number;
  name: string;
  description: string | null;
};

export const servicesCache = new Cache<NormalizedService[]>();

function normalizeService(raw: unknown): NormalizedService {
  if (!isRecord(raw)) {
    throw new Error("Servico em formato invalido.");
  }

  return {
    rawId: typeof raw.id === "number" ? raw.id : null,
    serviceId: resolveServiceId(raw),
    name: typeof raw.name === "string" ? raw.name : "Servico sem nome",
    description: typeof raw.description === "string" ? raw.description : null,
  };
}

export const getCompanyServices: ToolDefinition<typeof schema> = {
  name: "get_company_services",
  description:
    "Retorna os servicos disponiveis de uma empresa Filazero. Use o slug da empresa obtido em list_companies.",
  schema,
  inputSchema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "Slug da empresa retornado por list_companies" },
    },
    required: ["slug"],
  },
  async execute(args) {
    try {
      const cacheKey = `services:${args.slug}`;
      const cached = servicesCache.get(cacheKey);
      if (cached) {
        return toolSuccess({ slug: args.slug, services: cached, nextToolHint: "Use rawId para get_available_dates e get_available_sessions. Use serviceId para schedule_appointment." });
      }

      const response = await filazeroClient.get(`/api/companies/${args.slug}/services`);
      const items = checkAndExtract(response.data, ["services"]);
      const services = items.map(normalizeService);

      servicesCache.set(cacheKey, services, 300);

      return toolSuccess({
        slug: args.slug,
        services,
        nextToolHint: "Use rawId para get_available_dates e get_available_sessions. Use serviceId para schedule_appointment.",
      });
    } catch (error) {
      throw new Error(`Falha ao buscar servicos de '${args.slug}': ${formatErrorMessage(error)}`);
    }
  },
};
