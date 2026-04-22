import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { serviceSchema } from "@/lib/validation";

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

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => null);
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos para atualizar serviço.",
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

    const existing = await prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
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

    return NextResponse.json(service, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar serviço." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Serviço não encontrado." },
        { status: 404 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    return NextResponse.json(
      { error: "Erro ao excluir serviço." },
      { status: 500 }
    );
  }
}