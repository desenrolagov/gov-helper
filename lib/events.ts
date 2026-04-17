import { sendEmail } from "./email";
import {
  paymentApprovedTemplate,
  documentsSentTemplate,
  orderCompletedTemplate,
} from "./email-templates";

type EventType =
  | "PAYMENT_APPROVED"
  | "DOCUMENTS_SENT"
  | "ORDER_COMPLETED";

export async function emitEvent(
  type: EventType,
  payload: {
    email: string;
    name: string;
    orderId: string;
  }
) {
  switch (type) {
    case "PAYMENT_APPROVED":
      await sendEmail({
        to: payload.email,
        subject: "Pagamento aprovado",
        html: paymentApprovedTemplate(payload),
      });
      break;

    case "DOCUMENTS_SENT":
      await sendEmail({
        to: payload.email,
        subject: "Documentos recebidos",
        html: documentsSentTemplate(payload),
      });
      break;

    case "ORDER_COMPLETED":
      await sendEmail({
        to: payload.email,
        subject: "Seu serviço foi concluído",
        html: orderCompletedTemplate(payload),
      });
      break;
  }
}