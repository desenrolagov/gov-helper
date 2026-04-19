import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(normalizedPassword, user.password);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Senha inválida." },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        message: "Login realizado com sucesso.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
} catch (error) {
  console.error("[LOGIN] erro ao fazer login:", error);

  return NextResponse.json(
    {
      error: "Erro interno ao fazer login.",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    },
    { status: 500 }
  );
}
}