import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import type { OrderStatus } from "@/lib/order-flow";
import { canTransitionOrderStatus } from "@/lib/order-status";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "AWAITING_DOCUMENTS",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
];

async function ensureStatusHistory(orderId: string, status: OrderStatus) {
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

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        service: true,
        uploadedFiles: {
          orderBy: {
            createdAt: "desc",
          },
        },
        histories: {
          orderBy: {
            createdAt: "desc",
          },
        },
        resultFiles: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
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
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const nextStatus = body?.status as OrderStatus | undefined;

    if (!nextStatus) {
      return NextResponse.json(
        { error: "Status não informado." },
        { status: 400 }
      );
    }

    if (!VALID_ORDER_STATUSES.includes(nextStatus)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        uploadedFiles: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const currentStatus = order.status as OrderStatus;

    if (currentStatus === nextStatus) {
      return NextResponse.json(
        { error: "O pedido já está com esse status." },
        { status: 400 }
      );
    }

    if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
      return NextResponse.json(
        { error: "Transição de status inválida." },
        { status: 400 }
      );
    }

    if (
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

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        user: true,
        service: true,
        uploadedFiles: {
          orderBy: {
            createdAt: "desc",
          },
        },
        histories: {
          orderBy: {
            createdAt: "desc",
          },
        },
        resultFiles: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    await ensureStatusHistory(id, nextStatus);

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar pedido no admin:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar pedido." },
      { status: 500 }
    );
  }
}