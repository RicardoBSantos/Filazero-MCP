import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { listMyTickets } from "../../src/tools/listMyTickets.js";

const mockGet = vi.mocked(filazeroClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

const TICKETS = [
  { id: 1, status: "PENDING" },
  { id: 2, status: "CONFIRMED" },
];

describe("listMyTickets.execute", () => {
  it("retorna tickets da chave tickets", async () => {
    mockGet.mockResolvedValueOnce({ data: { tickets: TICKETS } });

    const result = await listMyTickets.execute({ bearerToken: "tok-xyz" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.tickets).toEqual(TICKETS);
  });

  it("retorna tickets da chave data como fallback", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: TICKETS } });

    const result = await listMyTickets.execute({ bearerToken: "tok-xyz" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.tickets).toEqual(TICKETS);
  });

  it("envia Authorization header com bearer token", async () => {
    mockGet.mockResolvedValueOnce({ data: { tickets: [] } });

    await listMyTickets.execute({ bearerToken: "tok-secret" });

    const [, config] = mockGet.mock.calls[0];
    expect((config as { headers: Record<string, string> }).headers.Authorization).toBe(
      "Bearer tok-secret",
    );
  });

  it("chama endpoint correto", async () => {
    mockGet.mockResolvedValueOnce({ data: { tickets: [] } });

    await listMyTickets.execute({ bearerToken: "tok" });

    expect(mockGet).toHaveBeenCalledWith(
      "/v2/ticketing/me/filtered-tickets",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
    );
  });

  it("lanca erro quando API falha", async () => {
    mockGet.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(
      listMyTickets.execute({ bearerToken: "bad-tok" }),
    ).rejects.toThrow("Falha ao listar tickets do usuario");
  });

  it("retorna array vazio quando sem tickets", async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    const result = await listMyTickets.execute({ bearerToken: "tok" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.tickets).toEqual([]);
  });
});
