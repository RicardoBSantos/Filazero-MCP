import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { checkTicketStatus } from "../../src/tools/checkTicketStatus.js";

const mockGet = vi.mocked(filazeroClient.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkTicketStatus.execute", () => {
  it("extrai ticket de data.data quando presente", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 123,
          status: "PENDING",
          createdAt: "2026-05-04T10:00:00Z",
        },
      },
    });

    const result = await checkTicketStatus.execute({ accessKey: "key-abc" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.id).toBe(123);
    expect(parsed.status).toBe("PENDING");
  });

  it("usa data diretamente quando sem data.data", async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: 55, status: "CALLED" },
    });

    const result = await checkTicketStatus.execute({ accessKey: "key-xyz" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.id).toBe(55);
    expect(parsed.status).toBe("CALLED");
  });

  it("converte datas ISO para formato pt-BR", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          status: "CONFIRMED",
          scheduledAt: "2026-05-10T14:30:00Z",
        },
      },
    });

    const result = await checkTicketStatus.execute({ accessKey: "key-dt" });
    const parsed = JSON.parse(result.content[0].text);

    // Deve ser formatado (nao permanecer como ISO)
    expect(parsed.scheduledAt).not.toBe("2026-05-10T14:30:00Z");
    expect(typeof parsed.scheduledAt).toBe("string");
  });

  it("mantem string invalida de data sem converter", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          status: "PENDING",
          createdAt: "nao-e-data",
        },
      },
    });

    const result = await checkTicketStatus.execute({ accessKey: "key-inv" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.createdAt).toBe("nao-e-data");
  });

  it("chama endpoint correto com accessKey como query param", async () => {
    mockGet.mockResolvedValueOnce({ data: { id: 1, status: "PENDING" } });

    await checkTicketStatus.execute({ accessKey: "my-key" });

    expect(mockGet).toHaveBeenCalledWith(
      "/v2/ticketing/public/ticket",
      expect.objectContaining({ params: { key: "my-key" } }),
    );
  });

  it("lanca erro quando response nao e objeto", async () => {
    mockGet.mockResolvedValueOnce({ data: "string-invalida" });

    await expect(
      checkTicketStatus.execute({ accessKey: "bad" }),
    ).rejects.toThrow("Falha ao consultar ticket");
  });

  it("lanca erro quando API falha", async () => {
    mockGet.mockRejectedValueOnce(new Error("connection refused"));

    await expect(
      checkTicketStatus.execute({ accessKey: "k" }),
    ).rejects.toThrow("Falha ao consultar ticket");
  });
});
