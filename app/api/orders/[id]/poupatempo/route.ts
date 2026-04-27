import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null);

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

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customerAddress: body.customerAddress,
        selectedPoupatempoName: body.name,
        selectedPoupatempoAddress: body.address,
        selectedPoupatempoCity: body.city,
        selectedPoupatempoDistanceKm: body.distanceKm,
        selectedPoupatempoLat: body.lat,
        selectedPoupatempoLng: body.lng,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Erro ao salvar Poupatempo:", error);

    return NextResponse.json(
      { error: "Erro ao salvar unidade escolhida." },
      { status: 500 }
    );
  }
}