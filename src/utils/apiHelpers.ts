import { throwIfBusinessError } from "./errors.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveServiceId(service: unknown): number {
  if (!isRecord(service)) {
    throw new Error("Servico em formato invalido.");
  }

  if (typeof service.abstractServiceId === "number" && service.abstractServiceId > 0) {
    return service.abstractServiceId;
  }

  if (typeof service.id === "number" && service.id > 0) {
    return service.id;
  }

  throw new Error("Servico sem id valido.");
}

export function extractArrayPayload(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (isRecord(payload.data)) {
    for (const key of keys) {
      if (Array.isArray(payload.data[key])) {
        return payload.data[key] as unknown[];
      }
    }
  }

  for (const key of keys) {
    if (Array.isArray(payload[key])) {
      return payload[key] as unknown[];
    }
  }

  return [];
}

export function checkAndExtract(payload: unknown, keys: string[] = []): unknown[] {
  throwIfBusinessError(payload);
  return extractArrayPayload(payload, keys);
}
