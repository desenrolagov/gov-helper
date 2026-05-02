export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_DOCUMENTS"
  | "WAITING_OPERATOR_SCHEDULE_REVIEW"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type OrderTone = "gray" | "blue" | "amber" | "emerald" | "red";

export const VALID_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "AWAITING_DOCUMENTS",
  "WAITING_OPERATOR_SCHEDULE_REVIEW",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "AWAITING_DOCUMENTS",
  "WAITING_OPERATOR_SCHEDULE_REVIEW",
  "PROCESSING",
];

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["AWAITING_DOCUMENTS", "PROCESSING", "CANCELLED"],
  AWAITING_DOCUMENTS: [
    "WAITING_OPERATOR_SCHEDULE_REVIEW",
    "PROCESSING",
    "CANCELLED",
  ],
WAITING_OPERATOR_SCHEDULE_REVIEW: [
  "PROCESSING",
  "COMPLETED",
  "AWAITING_DOCUMENTS",
  "CANCELLED",
],
  PROCESSING: ["COMPLETED", "AWAITING_DOCUMENTS", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    VALID_ORDER_STATUSES.includes(value as OrderStatus)
  );
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  if (currentStatus === nextStatus) {
    return false;
  }

  return ALLOWED_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

export function canCreateCheckoutForOrderStatus(
  status: OrderStatus | string
): boolean {
  return status === "PENDING_PAYMENT";
}

export function canUploadForOrderStatus(status: OrderStatus | string): boolean {
  return status === "PAID" || status === "AWAITING_DOCUMENTS";
}

export function canDeliverFinalResult(status: OrderStatus | string): boolean {
  return (
    status === "WAITING_OPERATOR_SCHEDULE_REVIEW" ||
    status === "PROCESSING" ||
    status === "COMPLETED"
  );
}

export function canExposeFinalResultToClient(status: OrderStatus | string): boolean {
  return status === "COMPLETED";
}

export function getOrderStatusMeta(status: OrderStatus) {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        label: "Aguardando pagamento",
        tone: "amber" as OrderTone,
      };

    case "PAID":
      return {
        label: "Pagamento aprovado",
        tone: "blue" as OrderTone,
      };

    case "AWAITING_DOCUMENTS":
      return {
        label: "Aguardando documentos",
        tone: "amber" as OrderTone,
      };

    case "WAITING_OPERATOR_SCHEDULE_REVIEW":
      return {
        label: "Aguardando orientação no WhatsApp",
        tone: "amber" as OrderTone,
      };

    case "PROCESSING":
      return {
        label: "Em andamento",
        tone: "blue" as OrderTone,
      };

    case "COMPLETED":
      return {
        label: "Concluído",
        tone: "emerald" as OrderTone,
      };

    case "CANCELLED":
      return {
        label: "Cancelado",
        tone: "red" as OrderTone,
      };

    default:
      return {
        label: "Status desconhecido",
        tone: "gray" as OrderTone,
      };
  }
}

export function getOrderToneClasses(tone: OrderTone) {
  switch (tone) {
    case "blue":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        button: "bg-blue-600 text-white hover:bg-blue-700",
        soft: "border-blue-200 bg-blue-50 text-blue-900",
      };

    case "amber":
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        button: "bg-amber-500 text-white hover:bg-amber-600",
        soft: "border-amber-200 bg-amber-50 text-amber-900",
      };

    case "emerald":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        button: "bg-emerald-600 text-white hover:bg-emerald-700",
        soft: "border-emerald-200 bg-emerald-50 text-emerald-900",
      };

    case "red":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        button: "bg-red-600 text-white hover:bg-red-700",
        soft: "border-red-200 bg-red-50 text-red-900",
      };

    case "gray":
    default:
      return {
        badge: "border-slate-200 bg-slate-100 text-slate-700",
        button: "bg-slate-900 text-white hover:bg-slate-800",
        soft: "border-slate-200 bg-slate-50 text-slate-900",
      };
  }
}

type TransitionContext = {
  hasPaid?: boolean;
  hasUploadedFiles?: boolean;
  hasResultFiles?: boolean;
};

export function getAvailableOrderTransitions(
  currentStatus: OrderStatus,
  context?: TransitionContext
): OrderStatus[] {
  const hasPaid = context?.hasPaid ?? false;
  const hasUploadedFiles = context?.hasUploadedFiles ?? false;
  const hasResultFiles = context?.hasResultFiles ?? false;

  const candidates = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

  return candidates.filter((nextStatus) => {
    if (
      [
        "PAID",
        "AWAITING_DOCUMENTS",
        "WAITING_OPERATOR_SCHEDULE_REVIEW",
        "PROCESSING",
        "COMPLETED",
      ].includes(nextStatus) &&
      !hasPaid
    ) {
      return false;
    }

    if (
      ["WAITING_OPERATOR_SCHEDULE_REVIEW", "PROCESSING"].includes(nextStatus) &&
      !hasUploadedFiles
    ) {
      return false;
    }

    if (nextStatus === "COMPLETED" && !hasResultFiles) {
      return false;
    }

    return true;
  });
}

type FlowAction = {
  label: string;
  href: string;
  disabled?: boolean;
};

type GetOrderFlowOptions = {
  orderId: string;
  filesCount?: number;
  resultFilesCount?: number;
  serviceName?: string;
  orderCode?: string | null;
};

export function getOrderFlow(
  status: OrderStatus,
  options: GetOrderFlowOptions
) {
  const filesCount = options.filesCount ?? 0;
  const resultFilesCount = options.resultFilesCount ?? 0;
  const serviceName = options.serviceName?.toLowerCase() || "";
  const orderCode = options.orderCode?.toLowerCase() || "";

  const isMEI = serviceName.includes("mei") || orderCode.startsWith("mei");
  const isRG = serviceName.includes("rg") || orderCode.startsWith("rg");

  switch (status) {
    case "PENDING_PAYMENT":
      return {
        tone: "amber" as OrderTone,
        clientMessage:
          "Seu pedido foi criado e está aguardando o pagamento para iniciar o atendimento.",
        nextStepLabel: "Realizar o pagamento",
        primaryAction: {
          label: "Ir para pagamento",
          href: `/payment?orderId=${options.orderId}`,
        } satisfies FlowAction,
        secondaryAction: {
          label: "Ver detalhes do pedido",
          href: `/orders/${options.orderId}`,
        } satisfies FlowAction,
      };

case "PAID":
  return {
    tone: "blue" as OrderTone,
    clientMessage: isMEI
      ? "Seu pagamento foi aprovado. Agora preencha o formulário para nossa equipe iniciar a abertura do MEI."
      : isRG
        ? "Seu pagamento foi aprovado. Agora preencha o formulário de pré-agendamento do RG e escolha a unidade do Poupatempo."
        : "Seu pagamento foi aprovado. Agora envie os documentos necessários para continuar o atendimento.",
    nextStepLabel: isMEI
      ? "Preencher formulário"
      : isRG
        ? "Preencher pré-agendamento"
        : "Enviar documentos",
    primaryAction: {
      label: isMEI || isRG ? "Preencher formulário" : "Enviar documentos",
      href: `/orders/${options.orderId}/upload`,
    } satisfies FlowAction,
    secondaryAction: {
      label: "Ver detalhes do pedido",
      href: `/orders/${options.orderId}`,
    } satisfies FlowAction,
  };

case "AWAITING_DOCUMENTS":
  return {
    tone: "amber" as OrderTone,
    clientMessage: isMEI
      ? "Estamos aguardando o preenchimento do formulário para iniciar a análise."
      : isRG
        ? "Estamos aguardando o formulário de pré-agendamento do RG para iniciar o atendimento."
        : filesCount > 0
          ? "Recebemos parte dos documentos. Finalize o envio para liberar a análise."
          : "Estamos aguardando o envio dos documentos obrigatórios para iniciar a análise.",
    nextStepLabel: isMEI
      ? "Concluir preenchimento do formulário"
      : isRG
        ? "Concluir pré-agendamento"
        : "Concluir envio dos documentos",
    primaryAction: {
      label: isMEI || isRG ? "Preencher formulário" : "Continuar envio",
      href: `/orders/${options.orderId}/upload`,
    } satisfies FlowAction,
    secondaryAction: {
      label: "Ver detalhes do pedido",
      href: `/orders/${options.orderId}`,
    } satisfies FlowAction,
  };

case "WAITING_OPERATOR_SCHEDULE_REVIEW":
  return {
    tone: "amber" as OrderTone,
    clientMessage:
      "Formulário recebido com sucesso. Agora nossa equipe irá orientar você pelo WhatsApp para finalizar o agendamento no seu próprio celular.",
    nextStepLabel: "Aguardar orientação do especialista",
    primaryAction: {
      label: "Ver detalhes do pedido",
      href: `/orders/${options.orderId}`,
    } satisfies FlowAction,
    secondaryAction: {
      label: "Meus pedidos",
      href: `/orders`,
    } satisfies FlowAction,
  };

    case "PROCESSING":
      return {
        tone: "blue" as OrderTone,
        clientMessage:
          "Seu pedido está em análise pela equipe. Assim que houver conclusão, o resultado final será liberado.",
        nextStepLabel: "Aguardar análise",
        primaryAction: {
          label: "Ver detalhes do pedido",
          href: `/orders/${options.orderId}`,
        } satisfies FlowAction,
        secondaryAction: {
          label: "Meus pedidos",
          href: `/orders`,
        } satisfies FlowAction,
      };

    case "COMPLETED":
      return {
        tone: "emerald" as OrderTone,
        clientMessage:
          resultFilesCount > 0
            ? "Seu pedido foi concluído e o resultado final já está disponível."
            : "Seu pedido foi concluído.",
        nextStepLabel: "Ver resultado final",
        primaryAction: {
          label: "Ver pedido concluído",
          href: `/orders/${options.orderId}`,
        } satisfies FlowAction,
        secondaryAction: {
          label: "Meus pedidos",
          href: `/orders`,
        } satisfies FlowAction,
      };

    case "CANCELLED":
      return {
        tone: "red" as OrderTone,
        clientMessage: "Este pedido foi cancelado.",
        nextStepLabel: "Pedido encerrado",
        primaryAction: {
          label: "Ver detalhes do pedido",
          href: `/orders/${options.orderId}`,
        } satisfies FlowAction,
        secondaryAction: {
          label: "Meus pedidos",
          href: `/orders`,
        } satisfies FlowAction,
      };

    default:
      return {
        tone: "gray" as OrderTone,
        clientMessage: "Não foi possível identificar o status atual do pedido.",
        nextStepLabel: "Verificar pedido",
        primaryAction: {
          label: "Ver detalhes do pedido",
          href: `/orders/${options.orderId}`,
        } satisfies FlowAction,
        secondaryAction: {
          label: "Meus pedidos",
          href: `/orders`,
        } satisfies FlowAction,
      };
  }
}

export function getOrderClientMessage(status: OrderStatus) {
  return getOrderFlow(status, {
    orderId: "",
  }).clientMessage;
}

export function getOrderNextStepLabel(status: OrderStatus) {
  return getOrderFlow(status, {
    orderId: "",
  }).nextStepLabel;
}