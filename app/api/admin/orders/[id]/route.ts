import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import type { OrderStatus } from "@/lib/order-flow";
import { canTransitionOrderStatus } from "@/lib/order-status";
import { syncOrderToProcessingIfReady } from "@/lib/order-processing";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "AWAITING_DOCUMENTS",
  "WAITING_OPERATOR_SCHEDULE_REVIEW",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

function isValidOrderStatus(value: string): value is OrderStatus {
  return VALID_ORDER_STATUSES.includes(value as OrderStatus);
}

async function ensureAdminSession() {
  const session = await verifySession();

  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      ),
    };
  }

  if (session.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    session,
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const auth = await ensureAdminSession();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;

    await syncOrderToProcessingIfReady(id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            codePrefix: true,
          },
        },
        uploadedFiles: {
          orderBy: { createdAt: "desc" },
        },
        resultFiles: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Erro ao buscar pedido no admin:", error);

    return NextResponse.json(
      { error: "Erro ao buscar pedido." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await ensureAdminSession();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const nextStatus =
      typeof body?.status === "string" ? body.status.trim() : "";

    if (!isValidOrderStatus(nextStatus)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
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
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const currentStatus = order.status as OrderStatus;

    const canCompleteWithoutFiles =
      currentStatus === "WAITING_OPERATOR_SCHEDULE_REVIEW" &&
      nextStatus === "COMPLETED";

    if (
      !canCompleteWithoutFiles &&
      (nextStatus === "PROCESSING" || nextStatus === "COMPLETED") &&
      order.uploadedFiles.length <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível avançar para esta etapa sem documentos enviados.",
        },
        { status: 400 }
      );
    }

    if (
      !canCompleteWithoutFiles &&
      nextStatus === "COMPLETED" &&
      order.resultFiles.length <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível concluir o pedido sem anexar ao menos 1 arquivo final para o cliente.",
        },
        { status: 400 }
      );
    }

    if (!canTransitionOrderStatus(currentStatus, nextStatus as OrderStatus)) {
      return NextResponse.json(
        {
          error: `Transição inválida: ${currentStatus} → ${nextStatus}.`,
        },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: nextStatus as OrderStatus,
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status: nextStatus as OrderStatus,
      },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar pedido." },
      { status: 500 }
    );
  }
}