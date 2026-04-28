import axios from "axios";

type ApiMessage = {
  type?: unknown;
  description?: unknown;
  message?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class FilazeroBusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FilazeroBusinessError";
  }
}

export function getBusinessErrorDescription(payload: unknown): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.messages)) {
    return null;
  }

  const errorMessage = payload.messages.find((message): message is ApiMessage => {
    return isRecord(message) && message.type === "ERROR";
  });

  if (!errorMessage) {
    return null;
  }

  if (typeof errorMessage.description === "string") {
    return errorMessage.description;
  }

  if (typeof errorMessage.message === "string") {
    return errorMessage.message;
  }

  return "Erro de negocio retornado pela API Filazero.";
}

export function throwIfBusinessError(payload: unknown): void {
  const description = getBusinessErrorDescription(payload);

  if (description) {
    throw new FilazeroBusinessError(description);
  }
}

export function formatErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const description = getBusinessErrorDescription(error.response?.data);

    if (description) {
      return description;
    }

    if (error.response?.status) {
      return `HTTP ${error.response.status}: ${error.message}`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido";
}
