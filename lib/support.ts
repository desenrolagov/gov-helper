export type SupportStage =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_DOCUMENTS"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "GENERAL";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  stage?: SupportStage;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-payment-1",
    question: "Já paguei. O que acontece agora?",
    answer:
      "Assim que o pagamento é confirmado, o sistema libera automaticamente a etapa de envio de documentos.",
    stage: "PAID",
  },
  {
    id: "faq-upload-1",
    question: "Quais documentos eu preciso enviar?",
    answer:
      "Você deve enviar os documentos obrigatórios do serviço contratado. No caso da regularização de CPF, a plataforma mostra os documentos exigidos na área de upload.",
    stage: "AWAITING_DOCUMENTS",
  },
  {
    id: "faq-upload-2",
    question: "Enviei tudo. Preciso fazer mais alguma coisa?",
    answer:
      "Não. Depois que todos os documentos obrigatórios forem enviados, o pedido segue para análise automaticamente conforme a regra operacional do sistema.",
    stage: "AWAITING_DOCUMENTS",
  },
  {
    id: "faq-processing-1",
    question: "Meu pedido está em andamento. O que significa?",
    answer:
      "Significa que os documentos já foram recebidos e o pedido está em análise ou execução pela equipe administrativa.",
    stage: "PROCESSING",
  },
  {
    id: "faq-result-1",
    question: "Como recebo o resultado final?",
    answer:
      "Assim que o atendimento for concluído, o arquivo final ficará disponível na área do pedido do cliente.",
    stage: "COMPLETED",
  },
  {
    id: "faq-general-1",
    question: "Posso acompanhar meu pedido pela plataforma?",
    answer:
      "Sim. Você pode acompanhar status, documentos enviados e resultado final diretamente na sua área do cliente.",
    stage: "GENERAL",
  },
  {
    id: "faq-general-2",
    question: "O pagamento é seguro?",
    answer:
      "Sim. O checkout é processado por provedor de pagamento seguro e o sistema só libera a próxima etapa após confirmação válida.",
    stage: "GENERAL",
  },
];

export function getSupportStageLabel(stage: SupportStage) {
  switch (stage) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return "Pagamento aprovado";
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos";
    case "PROCESSING":
      return "Em andamento";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Suporte geral";
  }
}

export function getSupportMessageByStage(stage: SupportStage) {
  switch (stage) {
    case "PENDING_PAYMENT":
      return "Seu pedido ainda depende da confirmação do pagamento para avançar.";
    case "PAID":
      return "Pagamento aprovado. O próximo passo é enviar os documentos obrigatórios.";
    case "AWAITING_DOCUMENTS":
      return "Envie todos os documentos obrigatórios para que o pedido siga para análise.";
    case "PROCESSING":
      return "Seu pedido está em análise ou execução. Nesta etapa, basta acompanhar o andamento.";
    case "COMPLETED":
      return "Seu pedido foi concluído e o resultado final já deve estar disponível.";
    case "CANCELLED":
      return "Este pedido foi cancelado e não aceita novas ações.";
    default:
      return "Selecione uma dúvida abaixo ou use o assistente para receber ajuda.";
  }
}

export function getFaqByStage(stage: SupportStage) {
  return FAQ_ITEMS.filter(
    (item) => item.stage === stage || item.stage === "GENERAL"
  );
}

export function getAssistantReply(
  message: string,
  stage: SupportStage = "GENERAL"
) {
  const normalized = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (
    normalized.includes("pag") ||
    normalized.includes("checkout") ||
    normalized.includes("cartao")
  ) {
    return "Se o pagamento já foi concluído, a plataforma deve liberar a próxima etapa automaticamente. Caso contrário, revise o pedido e tente novamente.";
  }

  if (
    normalized.includes("document") ||
    normalized.includes("arquivo") ||
    normalized.includes("upload")
  ) {
    return "Os documentos obrigatórios devem ser enviados na área do pedido. Após completar os envios necessários, o sistema encaminha o pedido para análise.";
  }

  if (
    normalized.includes("andamento") ||
    normalized.includes("analise") ||
    normalized.includes("processando")
  ) {
    return "Quando o pedido está em andamento, significa que a equipe já recebeu os documentos e está executando a próxima etapa do serviço.";
  }

  if (
    normalized.includes("resultado") ||
    normalized.includes("conclu") ||
    normalized.includes("final")
  ) {
    return "Quando o pedido for concluído, o arquivo final ficará disponível na área do cliente e o status será atualizado.";
  }

  return getSupportMessageByStage(stage);
}