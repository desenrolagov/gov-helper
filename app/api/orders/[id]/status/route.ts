import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import {
  canTransitionOrderStatus,
  canUploadForOrderStatus,
} from "@/lib/order-status";
import {
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";
import { ensureStatusHistory } from "@/lib/order-history";
import { createAuditLog } from "@/lib/audit";
import {
  badRequest,
  forbidden,
  notFound,
  serverError,
  unauthorized,
} from "@/lib/http";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!order) {
      return notFound("Pedido não encontrado.");
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = order.userId === user.id;

    if (!isAdmin && !isOwner) {
      return forbidden();
    }

    return NextResponse.json(
      {
        id: order.id,
        status: order.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar status do pedido:", error);
    return serverError("Erro ao buscar status do pedido.");
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorized();
    }

    if (user.role !== "ADMIN") {
      return forbidden("Apenas administradores podem atualizar o status.");
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const nextStatus = body?.status;

    if (!isValidOrderStatus(nextStatus)) {
      return badRequest("Status inválido.");
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        uploadedFiles: {
          select: { id: true },
        },
        resultFiles: {
          select: { id: true },
        },
        payments: {
          select: { status: true },
        },
      },
    });

    if (!order) {
      return notFound("Pedido não encontrado.");
    }

    const currentStatus = order.status as OrderStatus;

    if (currentStatus === nextStatus) {
      return badRequest("O pedido já está com esse status.");
    }

    if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
      return badRequest("Transição de status inválida.");
    }

    const hasPaid = order.payments.some(
      (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
    );

    const hasUploadedFiles = order.uploadedFiles.length > 0;
    const hasResultFiles = order.resultFiles.length > 0;

    if (
      ["PAID", "AWAITING_DOCUMENTS", "PROCESSING", "COMPLETED"].includes(
        nextStatus
      ) &&
      !hasPaid
    ) {
      return badRequest(
        "Não é possível avançar o pedido sem pagamento confirmado."
      );
    }

    if (
      (nextStatus === "PROCESSING" || nextStatus === "COMPLETED") &&
      !hasUploadedFiles
    ) {
      return badRequest(
        "Não é possível avançar para esta etapa sem documentos enviados."
      );
    }

    if (nextStatus === "COMPLETED" && !hasResultFiles) {
      return badRequest(
        "Não é possível concluir o pedido sem enviar o arquivo final."
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        user: true,
        service: true,
        uploadedFiles: {
          orderBy: { createdAt: "desc" },
        },
        histories: {
          orderBy: { createdAt: "desc" },
        },
        resultFiles: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    await ensureStatusHistory(id, nextStatus);

    await createAuditLog({
      action: "ORDER_STATUS_UPDATED",
      entityType: "order",
      entityId: id,
      userId: user.id,
      orderId: id,
      message: `Status alterado de ${currentStatus} para ${nextStatus}.`,
      metadata: {
        previousStatus: currentStatus,
        nextStatus,
        actorRole: user.role,
        canUploadNext: canUploadForOrderStatus(nextStatus),
      },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error);
    return serverError("Erro ao atualizar status do pedido.");
  }
}