#!/usr/bin/env node
import { run } from "./src/server.js";

run().catch((error: unknown) => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    message: "Erro fatal ao iniciar o servidor MCP",
    error: error instanceof Error ? error.message : String(error),
  });
  process.stderr.write(entry + "\n");
  process.exit(1);
});
