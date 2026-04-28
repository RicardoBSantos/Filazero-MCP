export const PROMPTS = [
  {
    name: "agendar-atendimento",
    description:
      "Fluxo completo de agendamento na plataforma Filazero. Guia o agente desde a escolha da empresa ate a confirmacao do agendamento.",
    arguments: [
      {
        name: "empresa",
        description: "Nome ou slug da empresa desejada",
        required: false,
      },
    ],
  },
  {
    name: "consultar-agendamento",
    description:
      "Consulta o status atual de um ticket/agendamento na plataforma Filazero usando a chave de acesso publica.",
    arguments: [
      {
        name: "accessKey",
        description: "Chave de acesso do ticket",
        required: false,
      },
    ],
  },
] as const;

type PromptMessage = {
  role: string;
  content: { type: string; text: string };
};

export function getPromptMessages(
  name: string,
  args: Record<string, string>,
): PromptMessage[] {
  if (name === "agendar-atendimento") {
    const empresaHint = args.empresa
      ? `O usuario deseja agendar na empresa "${args.empresa}". Busque-a na lista e use o slug correspondente.`
      : "Pergunte ao usuario em qual empresa ele deseja agendar.";

    return [
      {
        role: "system",
        content: {
          type: "text",
          text: [
            "Voce e um assistente de agendamento da plataforma Filazero.",
            "Siga esta sequencia de tools, coletando dados com o usuario a cada passo:",
            "",
            "1. list_companies — liste as empresas disponiveis.",
            `   ${empresaHint}`,
            "2. get_company_services — obtenha os servicos da empresa escolhida usando o slug.",
            "   Apresente os servicos e peca ao usuario para escolher.",
            "3. get_available_dates — consulte os dias disponiveis para o servico escolhido.",
            "   Peca ao usuario para escolher uma data.",
            "4. get_available_sessions — busque sessoes e recursos na data escolhida.",
            "   Apresente os horarios e peca ao usuario para escolher.",
            "5. get_booking_form — obtenha os campos do formulario de agendamento.",
            "   Peca ao usuario para preencher cada campo obrigatorio.",
            "6. schedule_appointment — crie o agendamento com os dados coletados.",
            "   Confirme o agendamento e apresente o ticketId e accessKey ao usuario.",
            "",
            "Se qualquer etapa falhar, informe o erro ao usuario e pergunte como deseja prosseguir.",
            "Nao pule etapas. Sempre colete a escolha do usuario antes de avancar.",
          ].join("\n"),
        },
      },
    ];
  }

  if (name === "consultar-agendamento") {
    const keyHint = args.accessKey
      ? `Use a chave de acesso "${args.accessKey}" para consultar o ticket.`
      : "Peca ao usuario a chave de acesso (accessKey) do ticket.";

    return [
      {
        role: "system",
        content: {
          type: "text",
          text: [
            "Voce e um assistente de consulta de agendamentos da plataforma Filazero.",
            keyHint,
            "",
            "Use a tool check_ticket_status com a accessKey fornecida.",
            "Apresente ao usuario: status atual, posicao na fila (se aplicavel), horario agendado e qualquer informacao relevante.",
            "Se o ticket nao for encontrado, informe o usuario e peca para verificar a chave.",
          ].join("\n"),
        },
      },
    ];
  }

  return [];
}
