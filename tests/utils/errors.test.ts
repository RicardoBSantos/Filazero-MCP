import { describe, it, expect } from "vitest";
import axios from "axios";
import {
  isRecord,
  getBusinessErrorDescription,
  throwIfBusinessError,
  formatErrorMessage,
  FilazeroBusinessError,
} from "../../src/utils/errors.js";

describe("isRecord", () => {
  it("retorna true para objeto simples", () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("retorna false para array", () => {
    expect(isRecord([])).toBe(false);
  });

  it("retorna false para null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("retorna false para string", () => {
    expect(isRecord("texto")).toBe(false);
  });

  it("retorna false para number", () => {
    expect(isRecord(42)).toBe(false);
  });

  it("retorna false para undefined", () => {
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("getBusinessErrorDescription", () => {
  it("retorna null para payload sem messages", () => {
    expect(getBusinessErrorDescription({})).toBeNull();
  });

  it("retorna null quando messages nao tem ERROR", () => {
    const payload = { messages: [{ type: "INFO", description: "ok" }] };
    expect(getBusinessErrorDescription(payload)).toBeNull();
  });

  it("retorna description quando mensagem de ERROR existe", () => {
    const payload = {
      messages: [{ type: "ERROR", description: "Servico indisponivel" }],
    };
    expect(getBusinessErrorDescription(payload)).toBe("Servico indisponivel");
  });

  it("usa campo message quando description ausente", () => {
    const payload = {
      messages: [{ type: "ERROR", message: "Erro generico" }],
    };
    expect(getBusinessErrorDescription(payload)).toBe("Erro generico");
  });

  it("retorna fallback quando nem description nem message presentes", () => {
    const payload = { messages: [{ type: "ERROR" }] };
    expect(getBusinessErrorDescription(payload)).toBe(
      "Erro de negocio retornado pela API Filazero.",
    );
  });

  it("retorna null para payload nao-objeto", () => {
    expect(getBusinessErrorDescription("string")).toBeNull();
    expect(getBusinessErrorDescription(null)).toBeNull();
    expect(getBusinessErrorDescription([])).toBeNull();
  });

  it("retorna null quando messages nao e array", () => {
    expect(getBusinessErrorDescription({ messages: "nao-array" })).toBeNull();
  });
});

describe("throwIfBusinessError", () => {
  it("nao lanca quando sem erro de negocio", () => {
    expect(() => throwIfBusinessError({})).not.toThrow();
  });

  it("lanca FilazeroBusinessError quando ha mensagem ERROR", () => {
    const payload = {
      messages: [{ type: "ERROR", description: "Slot indisponivel" }],
    };
    expect(() => throwIfBusinessError(payload)).toThrow(FilazeroBusinessError);
    expect(() => throwIfBusinessError(payload)).toThrow("Slot indisponivel");
  });
});

describe("formatErrorMessage", () => {
  it("formata erro axios com resposta de negocio", () => {
    const err = new axios.AxiosError("request failed");
    err.response = {
      data: { messages: [{ type: "ERROR", description: "Empresa nao encontrada" }] },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: {} as never,
    };
    expect(formatErrorMessage(err)).toBe("Empresa nao encontrada");
  });

  it("formata erro axios com status HTTP quando sem mensagem de negocio", () => {
    const err = new axios.AxiosError("Network Error");
    err.response = {
      data: {},
      status: 503,
      statusText: "Service Unavailable",
      headers: {},
      config: {} as never,
    };
    expect(formatErrorMessage(err)).toBe("HTTP 503: Network Error");
  });

  it("retorna message do axios quando sem response", () => {
    const err = new axios.AxiosError("timeout");
    expect(formatErrorMessage(err)).toBe("timeout");
  });

  it("formata Error generico", () => {
    expect(formatErrorMessage(new Error("erro qualquer"))).toBe("erro qualquer");
  });

  it("retorna fallback para tipo desconhecido", () => {
    expect(formatErrorMessage("string estranha")).toBe("Erro desconhecido");
    expect(formatErrorMessage(null)).toBe("Erro desconhecido");
  });
});
