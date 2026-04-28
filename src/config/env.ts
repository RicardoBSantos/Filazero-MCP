import dotenv from "dotenv";

dotenv.config();

const DEFAULT_API_URL = "https://api.staging.filazero.net";
const DEFAULT_APP_ORIGIN = "https://app.filazero.net";
const DEFAULT_CACHE_TTL_COMPANIES = 300;
const DEFAULT_LOG_LEVEL = "info";

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function parseTtl(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export const config = {
  apiUrl: normalizeUrl(process.env.FILAZERO_API_URL || DEFAULT_API_URL),
  appOrigin: normalizeUrl(process.env.FILAZERO_APP_ORIGIN || DEFAULT_APP_ORIGIN),
  cacheTtlCompanies: parseTtl(process.env.CACHE_TTL_COMPANIES, DEFAULT_CACHE_TTL_COMPANIES),
  logLevel: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
};
