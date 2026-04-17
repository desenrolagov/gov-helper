import {
  ALLOWED_STATUS_TRANSITIONS,
  canCreateCheckoutForOrderStatus as canCreateCheckoutForOrderStatusBase,
  canDeliverFinalResult as canDeliverFinalResultBase,
  canUploadForOrderStatus as canUploadForOrderStatusBase,
  isTerminalOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> =
  ALLOWED_STATUS_TRANSITIONS;

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  if (currentStatus === nextStatus) {
    return false;
  }

  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

export function getAllowedNextStatuses(
  currentStatus: OrderStatus
): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function canUploadForOrderStatus(status: OrderStatus): boolean {
  return canUploadForOrderStatusBase(status);
}

export function canDeliverFinalResult(status: OrderStatus): boolean {
  return canDeliverFinalResultBase(status);
}

export function isFinalOrderStatus(status: OrderStatus): boolean {
  return isTerminalOrderStatus(status);
}

export function canCreateCheckoutForOrderStatus(
  status: OrderStatus
): boolean {
  return canCreateCheckoutForOrderStatusBase(status);
}