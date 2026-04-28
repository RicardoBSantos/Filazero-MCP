export const RESOURCES = [
  {
    uri: "filazero://categories",
    name: "Categorias de Servicos",
    description: "Categorias de servicos disponiveis na plataforma Filazero",
    mimeType: "application/json" as const,
  },
  {
    uri: "filazero://ticket-lifecycle",
    name: "Ciclo de Vida de Tickets",
    description: "Estados e transicoes do ciclo de vida de tickets na plataforma Filazero",
    mimeType: "application/json" as const,
  },
  {
    uri: "filazero://scheduling-flow",
    name: "Fluxo de Agendamento",
    description: "Guia passo a passo do fluxo de agendamento na plataforma Filazero",
    mimeType: "application/json" as const,
  },
] as const;

export const RESOURCE_CONTENTS: Record<string, unknown> = {
  "filazero://categories": {
    categories: [
      { slug: "saude", name: "Saude", examples: ["Hospitais", "Clinicas", "Laboratorios"] },
      { slug: "servicos-publicos", name: "Servicos Publicos", examples: ["Prefeituras", "Detran", "Cartorio"] },
      { slug: "educacao", name: "Educacao", examples: ["Universidades", "Secretarias de Educacao"] },
      { slug: "financeiro", name: "Financeiro", examples: ["Bancos", "Cooperativas de Credito"] },
      { slug: "varejo", name: "Varejo", examples: ["Lojas", "Assistencia Tecnica"] },
    ],
  },
  "filazero://ticket-lifecycle": {
    statuses: ["PENDING", "CONFIRMED", "CALLED", "ATTENDED", "CANCELLED"],
    descriptions: {
      PENDING: "Ticket criado, aguardando confirmacao ou chamada.",
      CONFIRMED: "Ticket confirmado, aguardando ser chamado.",
      CALLED: "Ticket chamado para atendimento.",
      ATTENDED: "Atendimento realizado com sucesso.",
      CANCELLED: "Ticket cancelado pelo usuario ou pelo sistema.",
    },
    transitions: {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["CALLED", "CANCELLED"],
      CALLED: ["ATTENDED", "CANCELLED"],
      ATTENDED: [],
      CANCELLED: [],
    },
  },
  "filazero://scheduling-flow": {
    description: "Fluxo completo de agendamento na plataforma Filazero, da descoberta de empresas ate a consulta do ticket.",
    steps: [
      { order: 1, tool: "list_companies", description: "Listar empresas disponiveis na plataforma." },
      { order: 2, tool: "get_company_services", description: "Obter servicos da empresa usando o slug." },
      { order: 3, tool: "get_available_dates", description: "Consultar dias com sessoes disponiveis para o servico." },
      { order: 4, tool: "get_available_sessions", description: "Buscar sessoes e recursos disponiveis em uma data." },
      { order: 5, tool: "get_booking_form", description: "Obter campos customizados do formulario de agendamento." },
      { order: 6, tool: "schedule_appointment", description: "Criar o agendamento enviando os dados do formulario." },
      { order: 7, tool: "check_ticket_status", description: "Consultar status do ticket criado usando a chave de acesso." },
    ],
  },
};
