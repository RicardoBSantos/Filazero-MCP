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
