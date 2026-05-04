import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { getAvailableDates } from "../../src/tools/getAvailableDates.js";

const mockGet = vi.mocked(filazeroClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

const ARGS = { slug: "empresa-a", serviceId: 55, year: 2026, month: 5 };

describe("getAvailableDates.execute", () => {
  it("retorna dias disponiveis da chave days", async () => {
    mockGet.mockResolvedValueOnce({ data: { days: ["2026-05-10", "2026-05-15"] } });

    const result = await getAvailableDates.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.availableDays).toEqual(["2026-05-10", "2026-05-15"]);
    expect(parsed.slug).toBe("empresa-a");
    expect(parsed.serviceId).toBe(55);
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(5);
  });

  it("retorna dias da chave availableDays como fallback", async () => {
    mockGet.mockResolvedValueOnce({
      data: { availableDays: ["2026-05-20"] },
    });

    const result = await getAvailableDates.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.availableDays).toEqual(["2026-05-20"]);
  });

  it("retorna array vazio quando sem dias disponiveis", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    const result = await getAvailableDates.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.availableDays).toEqual([]);
  });

  it("nextToolHint aponta para get_available_sessions", async () => {
    mockGet.mockResolvedValueOnce({ data: { days: [] } });

    const result = await getAvailableDates.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.nextToolHint).toContain("get_available_sessions");
    expect(parsed.nextToolHint).not.toMatch(/ $/); // sem trailing space
  });

  it("lanca erro quando API retorna erro de negocio", async () => {
    mockGet.mockResolvedValueOnce({
      data: { messages: [{ type: "ERROR", description: "Servico invalido" }] },
    });

    await expect(getAvailableDates.execute(ARGS)).rejects.toThrow(
      "Falha ao buscar datas disponiveis",
    );
  });

  it("chama endpoint correto com params year e month", async () => {
    mockGet.mockResolvedValueOnce({ data: { days: [] } });

    await getAvailableDates.execute(ARGS);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/empresa-a/services/55/available-session-days"),
      expect.objectContaining({ params: { year: 2026, month: 5 } }),
    );
  });
});
