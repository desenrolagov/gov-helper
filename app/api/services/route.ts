import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

function normalizeCodePrefix(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, 10);
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    const services = await prisma.service.findMany({
      where: user?.role === "ADMIN" ? undefined : { active: true },
      orderBy: { createdAt: "desc" },
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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas admin pode criar serviço." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = body.name?.trim();
    const description = body.description?.trim() || "";
    const price = Number(body.price);
    const codePrefix = normalizeCodePrefix(body.codePrefix);

    if (!name) {
      return NextResponse.json(
        { error: "Nome do serviço é obrigatório." },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "Preço inválido." },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price,
        active: true,
        codePrefix: codePrefix || null,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);

    return NextResponse.json(
      { error: "Erro interno ao criar serviço." },
      { status: 500 }
    );
  }
}