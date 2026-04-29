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
        { error: "Você precisa estar logado para enviar os dados do MEI." },
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

    if (order.service.type !== "MEI") {
      return NextResponse.json(
        { error: "Este pedido não pertence ao serviço de MEI." },
        { status: 400 }
      );
    }

    if (
      order.status !== "PAID" &&
      order.status !== "AWAITING_DOCUMENTS" &&
      order.status !== "PROCESSING"
    ) {
      return NextResponse.json(
        { error: "O envio dos dados será liberado após o pagamento." },
        { status: 403 }
      );
    }

    const fullName = String(body.fullName || "").trim();
    const cpf = String(body.cpf || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const businessActivity = String(body.businessActivity || "").trim();

    if (!fullName || !cpf || !phone || !email || !businessActivity) {
      return NextResponse.json(
        {
          error:
            "Preencha nome completo, CPF, telefone, e-mail e atividade do MEI.",
        },
        { status: 400 }
      );
    }

    const birthDate = body.birthDate ? new Date(body.birthDate) : null;

    await prisma.meiApplication.upsert({
      where: {
        orderId,
      },
      update: {
        fullName,
        cpf,
        birthDate,
        phone,
        email,
        addressZipCode: body.addressZipCode || null,
        addressStreet: body.addressStreet || null,
        addressNumber: body.addressNumber || null,
        addressDistrict: body.addressDistrict || null,
        addressCity: body.addressCity || null,
        addressState: body.addressState || null,
        addressComplement: body.addressComplement || null,
        businessActivity,
        fantasyName: body.fantasyName || null,
        hasGovBrAccount:
          typeof body.hasGovBrAccount === "boolean"
            ? body.hasGovBrAccount
            : null,
        notes: body.notes || null,
      },
      create: {
        orderId,
        fullName,
        cpf,
        birthDate,
        phone,
        email,
        addressZipCode: body.addressZipCode || null,
        addressStreet: body.addressStreet || null,
        addressNumber: body.addressNumber || null,
        addressDistrict: body.addressDistrict || null,
        addressCity: body.addressCity || null,
        addressState: body.addressState || null,
        addressComplement: body.addressComplement || null,
        businessActivity,
        fantasyName: body.fantasyName || null,
        hasGovBrAccount:
          typeof body.hasGovBrAccount === "boolean"
            ? body.hasGovBrAccount
            : null,
        notes: body.notes || null,
      },
    });

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "PROCESSING",
      },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Dados do MEI enviados com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao salvar dados do MEI:", error);

    return NextResponse.json(
      { error: "Erro interno ao salvar os dados do MEI." },
      { status: 500 }
    );
  }
}