export type OrderStatusValue =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_DOCUMENTS"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export function shouldRedirectOrderDetailsToPayment(status?: string) {
  return status === "PENDING_PAYMENT";
}

export function canAccessUploadPage(status?: string) {
  return status === "PAID" || status === "AWAITING_DOCUMENTS";
}

export function shouldReturnFromUploadToOrder(status?: string) {
  return (
    status === "PROCESSING" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  );
}

export function getOrderPrimaryAction(status?: string) {
  if (status === "PENDING_PAYMENT") {
    return {
      href: "payment",
      label: "Pagar agora",
    };
  }

  if (status === "PAID" || status === "AWAITING_DOCUMENTS") {
    return {
      href: "upload",
      label: "Enviar documentos",
    };
  }

  return {
    href: "details",
    label: "Ver pedido",
  };
}