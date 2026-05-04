import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/http/filazeroClient.js", () => ({
  filazeroClient: { get: vi.fn() },
}));

import { filazeroClient } from "../../src/http/filazeroClient.js";
import { getBookingForm, formCache } from "../../src/tools/getBookingForm.js";

const mockGet = vi.mocked(filazeroClient.get);

beforeEach(() => {
  vi.clearAllMocks();
  formCache.clear();
});

const ARGS = { providerId: 7, sessionId: 42 };

const FIELDS = [
  { key: "nome", label: "Nome completo", required: true },
  { key: "cpf", label: "CPF", required: true },
];

describe("getBookingForm.execute", () => {
  it("retorna campos customizados da chave customFields", async () => {
    mockGet.mockResolvedValueOnce({ data: { customFields: FIELDS } });

    const result = await getBookingForm.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.customFields).toEqual(FIELDS);
    expect(parsed.providerId).toBe(7);
    expect(parsed.sessionId).toBe(42);
  });

  it("retorna campos da chave fields como fallback", async () => {
    mockGet.mockResolvedValueOnce({ data: { fields: FIELDS } });

    const result = await getBookingForm.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.customFields).toEqual(FIELDS);
  });

  it("nextToolHint aponta para schedule_appointment (nao create_appointment)", async () => {
    mockGet.mockResolvedValueOnce({ data: { customFields: [] } });

    const result = await getBookingForm.execute(ARGS);
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.nextToolHint).toContain("schedule_appointment");
    expect(parsed.nextToolHint).not.toContain("create_appointment");
  });

  it("chama endpoint correto com providerId e sessionId na URL", async () => {
    mockGet.mockResolvedValueOnce({ data: { customFields: [] } });

    await getBookingForm.execute(ARGS);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/providers/7/sessions/42/custom-fields"),
    );
  });

  it("lanca erro ao falhar na API", async () => {
    mockGet.mockRejectedValueOnce(new Error("timeout"));

    await expect(getBookingForm.execute(ARGS)).rejects.toThrow(
      "Falha ao buscar formulario da sessao 42",
    );
  });
});
