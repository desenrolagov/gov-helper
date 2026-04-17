import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId é obrigatório." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        documents: true,
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

    if (!isAdmin && order.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error:
            "Os documentos só ficam disponíveis quando o pedido estiver concluído.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(order.documents, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar documentos:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar documentos." },
      { status: 500 }
    );
  }
}