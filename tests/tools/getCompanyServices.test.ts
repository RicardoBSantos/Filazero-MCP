import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { getCompanyServices, servicesCache } from "../../src/tools/getCompanyServices.js";

const mockGet = vi.mocked(filazeroClient.get);

beforeEach(() => {
  vi.clearAllMocks();
  servicesCache.clear();
});

const SERVICE_WITH_ABSTRACT = {
  id: 1,
  abstractServiceId: 55,
  name: "Consulta Medica",
  description: "Consulta geral",
};

const SERVICE_WITHOUT_ABSTRACT = {
  id: 10,
  name: "Exame de Sangue",
  description: null,
};

describe("getCompanyServices.execute", () => {
  it("normaliza servico com abstractServiceId", async () => {
    mockGet.mockResolvedValueOnce({
      data: { services: [SERVICE_WITH_ABSTRACT] },
    });

    const result = await getCompanyServices.execute({ slug: "hospital-a" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.services[0]).toEqual({
      rawId: 1,
      serviceId: 55,
      name: "Consulta Medica",
      description: "Consulta geral",
    });
  });

  it("usa id como serviceId quando sem abstractServiceId", async () => {
    mockGet.mockResolvedValueOnce({
      data: { services: [SERVICE_WITHOUT_ABSTRACT] },
    });

    const result = await getCompanyServices.execute({ slug: "lab-b" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.services[0].serviceId).toBe(10);
    expect(parsed.services[0].rawId).toBe(10);
  });

  it("define rawId como null quando id nao e numero", async () => {
    mockGet.mockResolvedValueOnce({
      data: { services: [{ id: "string-id", abstractServiceId: 7, name: "Srv" }] },
    });

    const result = await getCompanyServices.execute({ slug: "empresa-x" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.services[0].rawId).toBeNull();
    expect(parsed.services[0].serviceId).toBe(7);
  });

  it("usa nome padrao quando servico sem name", async () => {
    mockGet.mockResolvedValueOnce({
      data: { services: [{ id: 3, abstractServiceId: 3 }] },
    });

    const result = await getCompanyServices.execute({ slug: "empresa-y" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.services[0].name).toBe("Servico sem nome");
  });

  it("lanca quando servico sem nenhum id valido", async () => {
    mockGet.mockResolvedValueOnce({
      data: { services: [{ name: "Sem ID" }] },
    });

    await expect(
      getCompanyServices.execute({ slug: "empresa-z" }),
    ).rejects.toThrow("Falha ao buscar servicos");
  });

  it("lanca quando API retorna erro de negocio", async () => {
    mockGet.mockResolvedValueOnce({
      data: { messages: [{ type: "ERROR", description: "Empresa nao encontrada" }] },
    });

    await expect(
      getCompanyServices.execute({ slug: "nao-existe" }),
    ).rejects.toThrow("Falha ao buscar servicos de 'nao-existe'");
  });

  it("nextToolHint menciona rawId e schedule_appointment", async () => {
    mockGet.mockResolvedValueOnce({
      data: { services: [SERVICE_WITH_ABSTRACT] },
    });

    const result = await getCompanyServices.execute({ slug: "empresa-ok" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.nextToolHint).toContain("rawId");
    expect(parsed.nextToolHint).toContain("schedule_appointment");
  });
});
