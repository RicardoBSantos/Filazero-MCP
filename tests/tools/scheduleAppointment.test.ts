import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { post: vi.fn() },
  writeHeaders: { "Content-Type": "application/json;charset=UTF-8" },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { scheduleAppointment } from "../../src/tools/scheduleAppointment.js";

const mockPost = vi.mocked(filazeroClient.post);

beforeEach(() => {
  vi.clearAllMocks();
});

const ARGS = {
  bearerToken: "tok-abc123",
  sessionId: 42,
  resourceId: 5,
  nome: "Joao Silva",
};

describe("scheduleAppointment.execute", () => {
  it("retorna ticketId e status em sucesso", async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: { id: 999, status: "CONFIRMED" } },
    });

    const result = await scheduleAppointment.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.ticketId).toBe(999);
    expect(parsed.status).toBe("CONFIRMED");
    expect(parsed.message).toBe("Agendamento criado com sucesso.");
  });

  it("nao inclui bearerToken no body enviado", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1, status: "PENDING" } });

    await scheduleAppointment.execute(ARGS);

    const [, body] = mockPost.mock.calls[0];
    expect(body).not.toHaveProperty("bearerToken");
    expect(body).toHaveProperty("sessionId", 42);
    expect(body).toHaveProperty("nome", "Joao Silva");
  });

  it("envia Authorization header com bearer token", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 1, status: "PENDING" } });

    await scheduleAppointment.execute(ARGS);

    const [, , config] = mockPost.mock.calls[0];
    expect((config as { headers: Record<string, string> }).headers.Authorization).toBe(
      "Bearer tok-abc123",
    );
  });

  it("usa ticketId quando id ausente no ticket", async () => {
    mockPost.mockResolvedValueOnce({
      data: { data: { ticketId: 777, status: "PENDING" } },
    });

    const result = await scheduleAppointment.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.ticketId).toBe(777);
  });

  it("usa status padrao 'scheduled' quando ausente", async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { id: 1 } } });

    const result = await scheduleAppointment.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.status).toBe("scheduled");
  });

  it("lanca erro ao falhar na API", async () => {
    mockPost.mockRejectedValueOnce(new Error("server error"));

    await expect(scheduleAppointment.execute(ARGS)).rejects.toThrow(
      "Falha ao criar agendamento",
    );
  });
});
