import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Você precisa estar logado para enviar os dados do RG." },
        { status: 401 }
      );
    }

    const { id: orderId } = await context.params;
    const body = await req.json();

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        service: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (order.service.type !== "RG") {
      return NextResponse.json(
        { error: "Este pedido não pertence ao serviço de RG." },
        { status: 400 }
      );
    }

    if (
      order.status !== "PAID" &&
      order.status !== "AWAITING_DOCUMENTS" &&
      order.status !== "PROCESSING" &&
      order.status !== "WAITING_OPERATOR_SCHEDULE_REVIEW"
    ) {
      return NextResponse.json(
        { error: "O formulário será liberado após o pagamento." },
        { status: 403 }
      );
    }

    const fullName = String(body.fullName || "").trim();
    const cpf = String(body.cpf || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const requestType = String(body.requestType || "").trim();
    const govBrAccess = String(body.govBrAccess || "").trim();

    if (!fullName || !cpf || !phone || !requestType || !govBrAccess) {
      return NextResponse.json(
        {
          error:
            "Preencha nome completo, CPF, WhatsApp, tipo de solicitação e acesso GOV.BR.",
        },
        { status: 400 }
      );
    }

    const birthDate = body.birthDate ? new Date(body.birthDate) : null;

    await prisma.rgApplication.upsert({
      where: {
        orderId,
      },
      create: {
        orderId,
        fullName,
        cpf,
        birthDate,
        phone,
        email: email || null,
        requestType,
        govBrAccess,
        notes: body.notes || null,
      },
      update: {
        fullName,
        cpf,
        birthDate,
        phone,
        email: email || null,
        requestType,
        govBrAccess,
        notes: body.notes || null,
      },
    });

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "WAITING_OPERATOR_SCHEDULE_REVIEW",
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "WAITING_OPERATOR_SCHEDULE_REVIEW",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Formulário RG enviado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao salvar formulário RG:", error);

    return NextResponse.json(
      { error: "Erro interno ao salvar os dados do RG." },
      { status: 500 }
    );
  }
}