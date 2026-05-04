import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { getAvailableSessions } from "../../src/tools/getAvailableSessions.js";

const mockGet = vi.mocked(filazeroClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

const ARGS = {
  slug: "empresa-a",
  locationId: 10,
  serviceId: 55,
  date: "2026-05-10",
};

describe("getAvailableSessions.execute", () => {
  it("retorna sessoes da chave sessions", async () => {
    const sessions = [{ id: 1, time: "09:00" }, { id: 2, time: "10:00" }];
    mockGet.mockResolvedValueOnce({ data: { sessions } });

    const result = await getAvailableSessions.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.sessions).toEqual(sessions);
    expect(parsed.date).toBe("2026-05-10");
    expect(parsed.locationId).toBe(10);
  });

  it("retorna da chave resources como fallback", async () => {
    const resources = [{ id: 5, name: "Sala A" }];
    mockGet.mockResolvedValueOnce({ data: { resources } });

    const result = await getAvailableSessions.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.sessions).toEqual(resources);
  });

  it("retorna array vazio quando sem sessoes", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    const result = await getAvailableSessions.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.sessions).toEqual([]);
  });

  it("nextToolHint menciona get_booking_form e schedule_appointment", async () => {
    mockGet.mockResolvedValueOnce({ data: { sessions: [] } });

    const result = await getAvailableSessions.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.nextToolHint).toContain("get_booking_form");
    expect(parsed.nextToolHint).toContain("schedule_appointment");
    expect(parsed.nextToolHint).not.toMatch(/ $/);
  });

  it("chama endpoint correto com locationId e serviceId na URL", async () => {
    mockGet.mockResolvedValueOnce({ data: { sessions: [] } });

    await getAvailableSessions.execute(ARGS);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/empresa-a/locations/10/services/55/sessions-resources-by-service"),
      expect.objectContaining({ params: { date: "2026-05-10" } }),
    );
  });

  it("lanca erro quando API retorna erro de negocio", async () => {
    mockGet.mockResolvedValueOnce({
      data: { messages: [{ type: "ERROR", description: "Data indisponivel" }] },
    });

    await expect(getAvailableSessions.execute(ARGS)).rejects.toThrow(
      "Falha ao buscar sessoes disponiveis para 2026-05-10",
    );
  });
});
