import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    const isAdmin = session.role === "ADMIN";
    const isOwner = order.userId === session.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const files = await prisma.orderResultFile.findMany({
      where: {
        orderId,
      },
      select: {
        id: true,
        originalName: true,
        savedName: true,
        mimeType: true,
        size: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    console.error("Erro ao listar arquivos finais do pedido:", error);

    return NextResponse.json(
      { error: "Erro ao listar arquivos finais." },
      { status: 500 }
    );
  }
}