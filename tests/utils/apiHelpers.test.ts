import { describe, it, expect } from "vitest";
import {
  isRecord,
  resolveServiceId,
  extractArrayPayload,
  checkAndExtract,
} from "../../src/utils/apiHelpers.js";
import { FilazeroBusinessError } from "../../src/utils/errors.js";

describe("isRecord (re-export de errors)", () => {
  it("funciona igual a versao em errors.ts", () => {
    expect(isRecord({ x: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
  });
});

describe("resolveServiceId", () => {
  it("prefere abstractServiceId quando positivo", () => {
    expect(resolveServiceId({ abstractServiceId: 99, id: 1 })).toBe(99);
  });

  it("cai para id quando abstractServiceId ausente", () => {
    expect(resolveServiceId({ id: 42 })).toBe(42);
  });

  it("ignora abstractServiceId zero ou negativo", () => {
    expect(resolveServiceId({ abstractServiceId: 0, id: 5 })).toBe(5);
    expect(resolveServiceId({ abstractServiceId: -1, id: 5 })).toBe(5);
  });

  it("lanca quando nao ha id valido", () => {
    expect(() => resolveServiceId({ name: "sem id" })).toThrow("Servico sem id valido.");
  });

  it("lanca quando argumento nao e objeto", () => {
    expect(() => resolveServiceId("string")).toThrow("Servico em formato invalido.");
    expect(() => resolveServiceId(null)).toThrow();
  });
});

describe("extractArrayPayload", () => {
  it("retorna array diretamente quando payload ja e array", () => {
    const arr = [1, 2, 3];
    expect(extractArrayPayload(arr, [])).toBe(arr);
  });

  it("extrai de payload.data quando e array", () => {
    const payload = { data: [{ id: 1 }] };
    expect(extractArrayPayload(payload, [])).toEqual([{ id: 1 }]);
  });

  it("extrai de payload.data[key] quando data e objeto", () => {
    const payload = { data: { companies: [{ slug: "abc" }] } };
    expect(extractArrayPayload(payload, ["companies"])).toEqual([{ slug: "abc" }]);
  });

  it("extrai de payload[key] diretamente", () => {
    const payload = { services: [{ id: 10 }] };
    expect(extractArrayPayload(payload, ["services"])).toEqual([{ id: 10 }]);
  });

  it("tenta keys em ordem e retorna primeira encontrada", () => {
    const payload = { slots: [1, 2], sessions: [3, 4] };
    expect(extractArrayPayload(payload, ["sessions", "slots"])).toEqual([3, 4]);
  });

  it("retorna array vazio quando nenhuma key bate", () => {
    expect(extractArrayPayload({ foo: "bar" }, ["companies"])).toEqual([]);
  });

  it("retorna array vazio para payload nao-objeto", () => {
    expect(extractArrayPayload("texto", [])).toEqual([]);
    expect(extractArrayPayload(null, [])).toEqual([]);
    expect(extractArrayPayload(42, [])).toEqual([]);
  });
});

describe("checkAndExtract", () => {
  it("lanca FilazeroBusinessError quando payload tem mensagem ERROR", () => {
    const payload = {
      messages: [{ type: "ERROR", description: "Erro de negocio" }],
    };
    expect(() => checkAndExtract(payload, [])).toThrow(FilazeroBusinessError);
  });

  it("retorna array extraido quando payload valido", () => {
    const payload = { companies: [{ slug: "empresa-a" }] };
    expect(checkAndExtract(payload, ["companies"])).toEqual([{ slug: "empresa-a" }]);
  });
});
