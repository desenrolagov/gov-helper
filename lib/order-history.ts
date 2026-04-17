import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/order-flow";

export async function ensureStatusHistory(
  orderId: string,
  status: OrderStatus
) {
  const existing = await prisma.orderStatusHistory.findFirst({
    where: { orderId, status },
    select: { id: true },
  });

  if (!existing) {
    await prisma.orderStatusHistory.create({
      data: { orderId, status },
    });
  }
}