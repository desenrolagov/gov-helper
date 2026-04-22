import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 🔹 GET — listar serviços
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 }
    );
  }
}

// 🔥 POST — criar serviço (ULTRA PRO)
export async function POST(req: NextRequest) {
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

    // 🔒 validação mínima
    if (!name || !price) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios." },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        codePrefix: codePrefix || null,

        // 🔥 NOVO SISTEMA DINÂMICO
        type: type || "OUTRO",
        highlights: highlights || [],
        documents: documents || [],
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço" },
      { status: 500 }
    );
  }
}