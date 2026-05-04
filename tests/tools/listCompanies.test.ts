import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { listCompanies, companiesCache } from "../../src/tools/listCompanies.js";

const mockGet = vi.mocked(filazeroClient.get);

const VALID_COMPANIES = [
  { id: "1", slug: "empresa-a", name: "Empresa A" },
  { id: "2", slug: "empresa-b", name: "Empresa B" },
];

beforeEach(() => {
  vi.clearAllMocks();
  companiesCache.clear();
});

describe("listCompanies.execute", () => {
  it("retorna lista de empresas normalizadas", async () => {
    mockGet.mockResolvedValueOnce({ data: { companies: VALID_COMPANIES } });

    const result = await listCompanies.execute({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.companies).toHaveLength(2);
    expect(parsed.companies[0]).toEqual({ id: "1", slug: "empresa-a", name: "Empresa A" });
    expect(parsed.nextToolHint).toContain("get_company_services");
  });

  it("aceita id numerico na empresa", async () => {
    mockGet.mockResolvedValueOnce({
      data: { companies: [{ id: 99, slug: "num-id", name: "Numerico" }] },
    });

    const result = await listCompanies.execute({});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.companies[0].id).toBe(99);
  });

  it("lanca erro quando empresa sem slug", async () => {
    mockGet.mockResolvedValueOnce({
      data: { companies: [{ id: "1", name: "Sem Slug" }] },
    });

    await expect(listCompanies.execute({})).rejects.toThrow("Falha ao listar empresas");
  });

  it("lanca erro quando empresa sem name", async () => {
    mockGet.mockResolvedValueOnce({
      data: { companies: [{ id: "1", slug: "ok" }] },
    });

    await expect(listCompanies.execute({})).rejects.toThrow("Falha ao listar empresas");
  });

  it("lanca erro quando API retorna erro de negocio", async () => {
    mockGet.mockResolvedValueOnce({
      data: { messages: [{ type: "ERROR", description: "Acesso negado" }] },
    });

    await expect(listCompanies.execute({})).rejects.toThrow("Falha ao listar empresas");
  });

  it("lanca erro quando API falha com excecao", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));

    await expect(listCompanies.execute({})).rejects.toThrow("Falha ao listar empresas");
  });

  it("usa cache na segunda chamada (nao chama API novamente)", async () => {
    mockGet.mockResolvedValue({ data: { companies: VALID_COMPANIES } });

    await listCompanies.execute({});
    await listCompanies.execute({});

    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
