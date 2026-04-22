import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 🔹 PATCH — atualizar
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const {
      name,
      description,
      price,
      codePrefix,
      type,
      highlights,
      documents,
    } = body;

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name,
        description,
        price: Number(price),
        codePrefix,

        // 🔥 IMPORTANTE
        type,
        highlights,
        documents,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.service.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    return NextResponse.json(
      { error: "Erro ao excluir serviço" },
      { status: 500 }
    );
  }
}