import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { generateOrderCode } from "@/lib/order-code";
import { createOrderSchema } from "@/lib/validation";
import { LEGAL_VERSION } from "@/lib/legal";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    let targetUserId = currentUser.id;

    if (requestedUserId) {
      const canAccess =
        currentUser.role === "ADMIN" || currentUser.id === requestedUserId;

      if (!canAccess) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }

      targetUserId = requestedUserId;
    }

    const orders = await prisma.order.findMany({
      where: { userId: targetUserId },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        service: true,
        uploadedFiles: true,
      },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar pedidos." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Somente clientes podem criar pedidos." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error:
            "Para continuar, aceite os Termos de Uso e a Política de Privacidade.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      serviceId,
      termsAccepted,
      privacyAccepted,
      legalVersion,
    } = validation.data;

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        {
          error:
            "Para continuar, aceite os Termos de Uso e a Política de Privacidade.",
        },
        { status: 400 }
      );
    }

    if (!legalVersion) {
      return NextResponse.json(
        { error: "Versão legal não informada." },
        { status: 400 }
      );
    }

    if (legalVersion !== LEGAL_VERSION) {
      return NextResponse.json(
        {
          error:
            "A versão legal enviada está desatualizada. Recarregue a página e tente novamente.",
        },
        { status: 400 }
      );
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        active: true,
      },
      select: {
        id: true,
        price: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado ou inativo." },
        { status: 404 }
      );
    }

    let orderCode = await generateOrderCode(service.id);
    const acceptedAt = new Date();

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            serviceId: service.id,
            totalAmount: Number(service.price),
            status: "PENDING_PAYMENT",
            orderCode,
            termsAccepted: true,
            privacyAccepted: true,
            termsAcceptedAt: acceptedAt,
            privacyAcceptedAt: acceptedAt,
            legalAcceptedVersion: LEGAL_VERSION,
            histories: {
              create: {
                status: "PENDING_PAYMENT",
              },
            },
          },
          include: {
            service: true,
            uploadedFiles: true,
            histories: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        return NextResponse.json(
          {
            message: "Pedido criado com sucesso.",
            order,
          },
          { status: 201 }
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";

        const isUniqueOrderCodeError =
          message.includes("unique") && message.includes("ordercode");

        if (!isUniqueOrderCodeError || attempt === 2) {
          throw error;
        }

        orderCode = await generateOrderCode(service.id);
      }
    }

    return NextResponse.json(
      { error: "Não foi possível gerar o código do pedido." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Erro ao criar pedido:", error);

    return NextResponse.json(
      { error: "Erro ao criar pedido." },
      { status: 500 }
    );
  }
}