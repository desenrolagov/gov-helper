import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
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
            price: true,
          },
        },
        rgApplication: {
          select: {
            phone: true,
          },
        },
        meiApplication: {
          select: {
            phone: true,
          },
        },
      },
    });

    const normalizedOrders = orders.map((order) => ({
      ...order,
      customerPhone:
        order.rgApplication?.phone ||
        order.meiApplication?.phone ||
        order.user.phone ||
        null,
    }));

    return NextResponse.json(normalizedOrders, { status: 200 });
  } catch (error) {
    console.error("❌ Erro REAL ao buscar pedidos do admin:", error);

    return NextResponse.json(
      { error: "Erro ao buscar pedidos." },
      { status: 500 }
    );
  }
}