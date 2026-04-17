import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { syncOrderToProcessingIfReady } from "@/lib/order-processing";

type AdminOrderRow = {
  id: string;
  orderCode: string | null;
  status: string;
  totalAmount: number;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
  };
  uploadedFiles: Array<{
    id: string;
    originalName: string;
    url: string;
    createdAt: Date;
    type: string | null;
  }>;
};

async function loadAdminOrders() {
  return prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      uploadedFiles: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          originalName: true,
          url: true,
          createdAt: true,
          type: true,
        },
      },
    },
  }) as Promise<AdminOrderRow[]>;
}

export async function GET() {
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

    const orders = await loadAdminOrders();

    const candidates = orders.filter(
      (order: AdminOrderRow) =>
        order.status === "AWAITING_DOCUMENTS" || order.status === "PAID"
    );

    if (candidates.length > 0) {
      await Promise.all(
        candidates.map((order: AdminOrderRow) =>
          syncOrderToProcessingIfReady(order.id)
        )
      );
    }

    const refreshedOrders = await loadAdminOrders();

    const normalizedOrders = refreshedOrders.map((order: AdminOrderRow) => ({
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      user: order.user,
      service: order.service,
      uploadedFiles: order.uploadedFiles,
    }));

    return NextResponse.json(normalizedOrders, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar pedidos do admin:", error);

    return NextResponse.json(
      { error: "Erro ao buscar pedidos." },
      { status: 500 }
    );
  }
}