# Filazero MCP Server

Gateway MCP (Model Context Protocol) público para a plataforma Filazero. Expõe a API do Filazero como tools, resources e prompts consumíveis por qualquer cliente MCP — Claude Desktop, VS Code, IDEs, agentes customizados.

---

## Como funciona o MCP

O **Model Context Protocol** é um protocolo aberto que permite que modelos de linguagem (LLMs) interajam com sistemas externos de forma padronizada. O servidor MCP atua como uma ponte entre o LLM e a API do Filazero.

```
┌──────────────────┐        stdio         ┌─────────────────────────┐        HTTPS        ┌──────────────────────┐
│  Cliente MCP     │ ◄──────────────────► │  Filazero MCP Server    │ ◄─────────────────► │  API Filazero        │
│ (Claude Desktop, │     JSON-RPC 2.0     │  (este repositório)     │                     │  (staging/produção)  │
│  VS Code, etc.)  │                      └─────────────────────────┘                     └──────────────────────┘
└──────────────────┘
```

**Transporte:** stdio — o cliente inicia o processo do servidor e se comunica via stdin/stdout com mensagens JSON-RPC 2.0.

**Capacidades expostas:**
- **Tools** — funções que o LLM pode invocar (ex: listar empresas, criar agendamento)
- **Resources** — dados estáticos consultáveis (ex: categorias, ciclo de vida de tickets)
- **Prompts** — fluxos conversacionais pré-definidos (ex: fluxo completo de agendamento)

---

## Pré-requisitos

- Node.js >= 18
- npm >= 9

---

## Instalação

```bash
git clone https://github.com/RicardoBSantos/FILAZERO-MCP-SERVER.git
cd FILAZERO-MCP-SERVER
npm install
```

---

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
# URL base da API Filazero (padrão: staging)
FILAZERO_API_URL=https://api.staging.filazero.net

# Origin enviado nos headers HTTP para simular o app web
FILAZERO_APP_ORIGIN=https://app.filazero.net

# TTL do cache de empresas em segundos (padrão: 300)
CACHE_TTL_COMPANIES=300

# Nível de log: debug | info | warn | error (padrão: info)
LOG_LEVEL=info
```

> O arquivo `.env` é ignorado pelo git. Nunca commite credenciais.

---

## Build e execução

```bash
# Compilar TypeScript para dist/
npm run build

# Rodar o servidor compilado
npm start

# Modo watch (desenvolvimento — recompila ao salvar)
npm run dev
```

---

## Testes

```bash
# Rodar toda a suite de testes
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch
```

---

## Testando com MCP Inspector

O **MCP Inspector** é uma interface web interativa oficial do protocolo MCP para inspecionar e testar servidores MCP sem precisar de um cliente LLM. Permite invocar tools, ler resources e executar prompts diretamente pelo navegador.

### Pré-requisito

Compilar o servidor antes de rodar o Inspector:

```bash
npm run build
```

### Iniciar o Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

O Inspector inicia dois processos:
- **Proxy server** (porta `3000` por padrão) — intermediário entre o navegador e o servidor MCP
- **Interface web** (porta `5173` por padrão) — abre automaticamente em `http://localhost:5173`

### Passando variáveis de ambiente

```bash
npx @modelcontextprotocol/inspector \
  -e FILAZERO_API_URL=https://api.staging.filazero.net \
  -e FILAZERO_APP_ORIGIN=https://app.filazero.net \
  -e CACHE_TTL_COMPANIES=300 \
  node dist/index.js
```

Ou carregando do `.env` diretamente via `dotenv`:

```bash
node -r dotenv/config node_modules/.bin/inspector dist/index.js
```

### Usando a interface

1. Abra `http://localhost:5173` no navegador
2. Clique em **Connect** — o Inspector conecta ao servidor via stdio
3. Na aba **Tools**: selecione uma tool, preencha os parâmetros em JSON e clique em **Run Tool**
4. Na aba **Resources**: selecione um resource URI e clique em **Read Resource**
5. Na aba **Prompts**: selecione um prompt, preencha os argumentos e clique em **Get Prompt**

### Exemplo: testar `list_companies`

1. Aba **Tools** → selecione `list_companies`
2. Parâmetros: `{}` (nenhum parâmetro necessário)
3. Clique **Run Tool**
4. Resultado aparece no painel direito em JSON

### Exemplo: testar `schedule_appointment` (autenticado)

1. Aba **Tools** → selecione `schedule_appointment`
2. Preencha `bearerToken` com um token válido obtido do app Filazero
3. Preencha os demais campos obtidos via `get_booking_form`
4. Clique **Run Tool**

> **Dica:** use `list_companies` → `get_company_services` → `get_available_dates` → `get_available_sessions` → `get_booking_form` em sequência para montar os parâmetros de `schedule_appointment`.

---

## Integração com Claude Desktop

Adicione o servidor ao arquivo de configuração do Claude Desktop:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filazero": {
      "command": "node",
      "args": ["/caminho/absoluto/para/FILAZERO-MCP-SERVER/dist/index.js"],
      "env": {
        "FILAZERO_API_URL": "https://api.staging.filazero.net",
        "FILAZERO_APP_ORIGIN": "https://app.filazero.net",
        "CACHE_TTL_COMPANIES": "300"
      }
    }
  }
}
```

Reinicie o Claude Desktop após salvar. O servidor aparece no painel de ferramentas disponíveis.

---

## Integração com VS Code (extensão Claude)

Adicione ao `settings.json` do VS Code:

```json
{
  "claude.mcpServers": {
    "filazero": {
      "command": "node",
      "args": ["/caminho/absoluto/para/FILAZERO-MCP-SERVER/dist/index.js"]
    }
  }
}
```

---

## Tools disponíveis

### `list_companies`
Lista todas as empresas cadastradas na plataforma Filazero. Resultados são cacheados por `CACHE_TTL_COMPANIES` segundos.

**Parâmetros:** nenhum

**Retorna:** lista de empresas com `id`, `slug` e `name`.

---

### `get_company_services`
Retorna os serviços disponíveis de uma empresa.

| Parâmetro | Tipo   | Descrição                                      |
|-----------|--------|------------------------------------------------|
| `slug`    | string | Slug da empresa (obtido via `list_companies`)  |

**Retorna:** lista de serviços com `serviceId`, `name` e `description`.

---

### `get_available_dates`
Retorna os dias com sessões disponíveis para agendamento de um serviço em um mês/ano.

| Parâmetro   | Tipo   | Descrição                                               |
|-------------|--------|---------------------------------------------------------|
| `slug`      | string | Slug da empresa                                         |
| `serviceId` | number | ID do serviço (obtido via `get_company_services`)       |
| `year`      | number | Ano (ex: `2026`)                                        |
| `month`     | number | Mês de 1 a 12                                           |

---

### `get_available_sessions`
Retorna sessões e recursos disponíveis para agendamento em uma data específica.

| Parâmetro    | Tipo   | Descrição                                               |
|--------------|--------|---------------------------------------------------------|
| `slug`       | string | Slug da empresa                                         |
| `locationId` | number | ID da unidade/local                                     |
| `serviceId`  | number | ID do serviço (obtido via `get_company_services`)       |
| `date`       | string | Data no formato `YYYY-MM-DD`                            |

---

### `get_booking_form`
Retorna os campos customizados do formulário necessários para criar um agendamento.

| Parâmetro   | Tipo   | Descrição                                               |
|-------------|--------|---------------------------------------------------------|
| `providerId`| number | ID do provider/empresa                                  |
| `sessionId` | number | ID da sessão (obtido via `get_available_sessions`)      |

---

### `schedule_appointment`
Cria um agendamento (ticket) na plataforma. Requer autenticação do usuário.

| Parâmetro      | Tipo   | Descrição                                          |
|----------------|--------|----------------------------------------------------|
| `bearerToken`  | string | Token de autenticação do usuário                   |
| `...campos`    | -      | Campos dinâmicos do formulário (`get_booking_form`)|

**Retorna:** `ticketId` e `accessKey` do agendamento criado.

---

### `check_ticket_status`
Consulta o status atual de um ticket usando sua chave pública de acesso.

| Parâmetro   | Tipo   | Descrição                    |
|-------------|--------|------------------------------|
| `accessKey` | string | Chave pública do ticket      |

**Retorna:** status, posição na fila, horário agendado e datas formatadas em horário de Brasília.

---

### `list_my_tickets`
Lista todos os tickets do usuário autenticado.

| Parâmetro     | Tipo   | Descrição                        |
|---------------|--------|----------------------------------|
| `bearerToken` | string | Token de autenticação do usuário |

---

## Resources disponíveis

Resources são dados estáticos que o LLM pode consultar para contexto.

| URI                          | Descrição                                         |
|------------------------------|---------------------------------------------------|
| `filazero://categories`      | Categorias de serviços disponíveis na plataforma  |
| `filazero://ticket-lifecycle`| Estados e transições do ciclo de vida de tickets  |
| `filazero://scheduling-flow` | Guia passo a passo do fluxo de agendamento        |

### Ciclo de vida de tickets

```
PENDING → CONFIRMED → CALLED → ATTENDED
    ↓           ↓         ↓
CANCELLED   CANCELLED  CANCELLED
```

---

## Prompts disponíveis

Prompts são fluxos conversacionais pré-definidos que guiam o LLM por sequências de tools.

### `agendar-atendimento`
Fluxo completo de agendamento: da escolha da empresa até a confirmação do ticket.

**Sequência de tools invocadas pelo agente:**
1. `list_companies` — lista empresas
2. `get_company_services` — obtém serviços
3. `get_available_dates` — dias disponíveis
4. `get_available_sessions` — sessões do dia
5. `get_booking_form` — campos do formulário
6. `schedule_appointment` — cria o agendamento

**Argumento opcional:** `empresa` — nome ou slug da empresa desejada.

---

### `consultar-agendamento`
Consulta o status de um ticket via chave de acesso pública.

**Argumento opcional:** `accessKey` — chave de acesso do ticket.

---

## Arquitetura

```
src/
├── index.ts                  # Entrypoint — inicializa e conecta o servidor
├── server.ts                 # Configuração do servidor MCP e handlers
├── config/
│   └── env.ts                # Variáveis de ambiente e valores padrão
├── http/
│   └── filazeroClient.ts     # Cliente axios com headers Filazero
├── cache/
│   └── index.ts              # Cache em memória com TTL
├── tools/                    # Uma tool por arquivo
│   ├── index.ts              # Exporta ALL_TOOLS
│   ├── listCompanies.ts
│   ├── getCompanyServices.ts
│   ├── getAvailableDates.ts
│   ├── getAvailableSessions.ts
│   ├── getBookingForm.ts
│   ├── scheduleAppointment.ts
│   ├── checkTicketStatus.ts
│   └── listMyTickets.ts
├── prompts/
│   └── index.ts              # Definição e mensagens dos prompts
├── resources/
│   └── index.ts              # Resources estáticos
├── types/
│   └── index.ts              # Tipos compartilhados (ToolDefinition, etc.)
└── utils/
    ├── apiHelpers.ts         # Helpers de extração e validação de API
    ├── errors.ts             # FilazeroBusinessError e formatação de erros
    └── logger.ts             # Logger estruturado
```

---

## Tratamento de Erros

O servidor MCP possui um pipeline de erros em 4 camadas, do mais específico ao mais genérico:

### 1. Interceptor HTTP (axios)

Toda requisição à API Filazero passa pelo interceptor em `filazeroClient.ts`. Quando a API retorna um erro HTTP, o interceptor:

1. Extrai a mensagem de negócio do payload (`payload.messages[].type === "ERROR"`)
2. Emite um log estruturado no `stderr` com URL, status HTTP e descrição
3. Converte em `FilazeroBusinessError` se houver mensagem de negócio

**Log emitido:**

```json
{
  "timestamp": "2026-05-06T12:00:00.000Z",
  "level": "error",
  "message": "Filazero API request failed",
  "url": "/api/companies",
  "status": 403,
  "description": "Acesso negado"
}
```

### 2. Erro de negócio (`FilazeroBusinessError`)

Classe customizada que encapsula mensagens de erro retornadas pela API Filazero. O helper `throwIfBusinessError()` inspeciona o payload de resposta buscando:

```typescript
// Formato esperado da API Filazero
{
  "messages": [
    { "type": "ERROR", "description": "Empresa não encontrada" }
  ]
}
```

Prioridade de extração: campo `description` > campo `message` > fallback genérico.

### 3. Validação de parâmetros (Zod)

Cada tool valida seus argumentos com schemas Zod antes da execução. Erros de validação são interceptados no handler `CallToolRequest` do servidor:

```
Parametros invalidos para get_available_dates: Expected number, received string
```

### 4. Handler genérico no servidor (`server.ts`)

O handler `CallToolRequest` captura todos os erros não tratados e formata a mensagem final usando `formatErrorMessage()`:

| Tipo de erro           | Formato da mensagem                                        |
|------------------------|------------------------------------------------------------|
| `FilazeroBusinessError`| `Falha ao [ação]: [mensagem da API]`                       |
| Erro HTTP sem negócio  | `Falha ao [ação]: HTTP 500: Request failed`                |
| Erro genérico          | `Falha ao [ação]: [error.message]`                         |
| Erro desconhecido      | `Falha ao [ação]: Erro desconhecido`                       |
| Ferramenta inexistente | `Ferramenta desconhecida: [nome]`                          |
| Validação Zod          | `Parametros invalidos para [nome]: [detalhes]`             |

### 5. Erros no transporte HTTP (StreamableHTTP)

Quando o servidor roda em modo HTTP (`MCP_TRANSPORT=http`), erros no processamento de requisições MCP retornam JSON-RPC 2.0:

```json
{
  "jsonrpc": "2.0",
  "error": { "code": -32603, "message": "Internal server error" },
  "id": null
}
```

Rotas não-MCP retornam erros HTTP padrão:

| Rota            | Método        | Resposta                                              |
|-----------------|---------------|-------------------------------------------------------|
| `GET /mcp`      | GET           | `405` — `Method not allowed. Use POST.`               |
| `DELETE /mcp`   | DELETE        | `405` — `Method not allowed.`                         |
| Qualquer outra  | *             | `404` — `Not found`                                   |

**Log emitido em erro de transporte:**

```json
{
  "timestamp": "2026-05-06T12:00:00.000Z",
  "level": "error",
  "message": "http_request_error",
  "error": "mensagem do erro"
}
```

### Fluxo completo de um erro

```
API Filazero retorna erro
        │
        ▼
Interceptor axios extrai mensagem de negócio
  → log "Filazero API request failed" (stderr)
  → lança FilazeroBusinessError
        │
        ▼
Tool catch formata: "Falha ao [ação]: [mensagem]"
  → lança Error com mensagem formatada
        │
        ▼
Handler CallToolRequest captura
  → retorna erro ao cliente MCP via JSON-RPC
```

---

## Logs

Todos os logs são emitidos em `stderr` no formato JSON estruturado (nunca em `stdout`, que é reservado para o protocolo MCP).

### Formato

```json
{
  "timestamp": "2026-05-06T12:00:00.000Z",
  "level": "info",
  "message": "mcp_server_started",
  "transport": "stdio"
}
```

### Níveis

Configurável via variável `LOG_LEVEL` (padrão: `info`). Mensagens abaixo do nível configurado são descartadas.

| Nível   | Quando usar                                          |
|---------|------------------------------------------------------|
| `debug` | Detalhes internos de execução                        |
| `info`  | Eventos normais (início do servidor, conexões)       |
| `warn`  | Situações inesperadas mas recuperáveis               |
| `error` | Falhas de requisição, erros de transporte            |

### Catálogo de logs

| Nível   | Mensagem                         | Contexto                                  | Origem               |
|---------|----------------------------------|-------------------------------------------|----------------------|
| `info`  | `mcp_server_started`             | `{ transport, port? }`                    | `server.ts`          |
| `error` | `Filazero API request failed`    | `{ url, status, description }`            | `filazeroClient.ts`  |
| `error` | `http_request_error`             | `{ error }`                               | `server.ts` (HTTP)   |

---

## Variáveis de ambiente — referência completa

| Variável               | Padrão                            | Descrição                          |
|------------------------|-----------------------------------|------------------------------------|
| `FILAZERO_API_URL`     | `https://api.staging.filazero.net`| URL base da API                    |
| `FILAZERO_APP_ORIGIN`  | `https://app.filazero.net`        | Header `Origin` nas requisições    |
| `CACHE_TTL_COMPANIES`  | `300`                             | TTL do cache de empresas (segundos)|
| `LOG_LEVEL`            | `info`                            | Nível de log                       |

---

## Licença

Proprietário — Filazero. Uso interno.
