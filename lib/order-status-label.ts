import {
  getOrderClientMessage,
  getOrderStatusMeta,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

export type { OrderStatus } from "@/lib/order-flow";

export function getOrderStatusLabel(status: OrderStatus | string): string {
  if (!isValidOrderStatus(status)) {
    return "Status não identificado";
  }

  return getOrderStatusMeta(status).label;
}

export function getNextStepMessage(status: OrderStatus | string): string {
  if (!isValidOrderStatus(status)) {
    return "Acompanhe o andamento do seu pedido.";
  }

  return getOrderClientMessage(status);
}