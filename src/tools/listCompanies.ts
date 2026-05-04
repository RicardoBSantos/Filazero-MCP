import { z } from "zod";
import { filazeroClient } from "../http/filazeroClient.js";
import { Cache } from "../cache/index.js";
import { config } from "../config/env.js";
import { checkAndExtract, isRecord } from "../utils/apiHelpers.js";
import { formatErrorMessage } from "../utils/errors.js";
import type { NormalizedCompany, ToolDefinition } from "../types/index.js";
import { toolSuccess } from "../types/index.js";

const schema = z.object({}).strict();

export const companiesCache = new Cache<NormalizedCompany[]>();

function normalizeCompany(raw: unknown): NormalizedCompany {
  if (!isRecord(raw)) {
    throw new Error("Empresa retornada pela API Filazero em formato invalido.");
  }

  const { id, slug, name } = raw;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof slug !== "string" ||
    typeof name !== "string"
  ) {
    throw new Error("Empresa retornada pela API Filazero sem id, slug ou name valido.");
  }

  return { id, slug, name };
}

export const listCompanies: ToolDefinition<typeof schema> = {
  name: "list_companies",
  description:
    "Lista publicamente as empresas da plataforma Filazero. Use o campo slug retornado na proxima tool get_company_services.",
  schema,
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  async execute() {
    try {
      const cached = companiesCache.get("all");
      if (cached) {
        return toolSuccess({ companies: cached, nextToolHint: "Use o slug da empresa na tool get_company_services." });
      }

      const response = await filazeroClient.get("/api/companies");
      const items = checkAndExtract(response.data, ["companies"]);
      const companies = items.map(normalizeCompany);

      companiesCache.set("all", companies, config.cacheTtlCompanies);

      return toolSuccess({ companies, nextToolHint: "Use o slug da empresa na tool get_company_services." });
    } catch (error) {
      throw new Error(`Falha ao listar empresas: ${formatErrorMessage(error)}`);
    }
  },
};
