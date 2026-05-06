# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP (Model Context Protocol) server for the Filazero platform — a public gateway that exposes Filazero API functionality as MCP tools. Communicates via stdio transport. Written in TypeScript (ES modules).

## Commands

- `npm run build` — compile TypeScript (`tsc`) to `dist/`
- `npm run dev` — watch mode (`tsc --watch`)
- `npm start` — run compiled server (`node dist/index.js`)

Test framework: vitest (`npm test`).

## Architecture

Single-file server (`src/index.ts`) using `@modelcontextprotocol/sdk`. All logic lives here:

- **MCP tools exposed:**
  - `list_companies` — lista empresas (cache em memória, TTL configurável)
  - `get_company_services` — serviços de uma empresa pelo slug
  - `get_available_dates` — dias com sessões disponíveis (slug + serviceId + ano/mês)
  - `get_available_sessions` — sessões numa data específica
  - `get_booking_form` — campos do formulário de agendamento
  - `schedule_appointment` — cria agendamento (requer bearerToken)
  - `check_ticket_status` — consulta status público de ticket por accessKey
  - `list_my_tickets` — lista tickets do usuário autenticado (requer bearerToken)
- **Transport:** stdio (`StdioServerTransport`)
- **Validation:** Zod schemas for tool arguments
- **HTTP:** axios with custom headers (Origin, Referer, User-Agent) to match Filazero app requests
- **Error handling:** `FilazeroBusinessError` wraps API error responses; axios errors parsed for business-level messages from `payload.messages[].type === "ERROR"`

## Environment Variables

- `FILAZERO_API_URL` — API base URL (default: `https://api.staging.filazero.net`)
- `FILAZERO_APP_ORIGIN` — Origin header value (default: `https://app.filazero.net`)
- `CACHE_TTL_COMPANIES` — companies cache TTL in seconds (default: 300)
- `RATE_LIMIT_RPM` — max API requests per minute (default: 30)

Uses `dotenv` — place variables in `.env` (gitignored).

## Language

API responses, error messages, and tool descriptions are in Brazilian Portuguese.
