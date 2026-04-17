import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const canAccess = user.role === "ADMIN" || order.userId === user.id;

    if (!canAccess) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar histórico do pedido:", error);
    return NextResponse.json(
      { error: "Erro ao buscar histórico do pedido" },
      { status: 500 }
    );
  }
}