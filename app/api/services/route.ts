import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { serviceSchema } from "@/lib/validation";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: [
        { createdAt: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos para criar serviço.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      price,
      codePrefix,
      type,
      highlights,
      documents,
      active,
    } = validation.data;

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price,
        codePrefix: codePrefix?.trim() || null,
        type: type.trim().toUpperCase(),
        highlights,
        documents,
        active: active ?? true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço." },
      { status: 500 }
    );
  }
}