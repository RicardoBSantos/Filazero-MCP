import { config } from "../config/env.js";

const LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LEVELS)[number];

const minLevelIndex = LEVELS.indexOf(config.logLevel as LogLevel);
const effectiveMinIndex = minLevelIndex === -1 ? 1 : minLevelIndex;

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (LEVELS.indexOf(level) < effectiveMinIndex) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => log("debug", message, data),
  info: (message: string, data?: Record<string, unknown>) => log("info", message, data),
  warn: (message: string, data?: Record<string, unknown>) => log("warn", message, data),
  error: (message: string, data?: Record<string, unknown>) => log("error", message, data),
};
