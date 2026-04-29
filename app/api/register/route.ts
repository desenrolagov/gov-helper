import { createSession } from "@/lib/auth";
import {
  buildRateLimitKey,
  createRateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation";
import { LEGAL_VERSION } from "@/lib/legal";

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(buildRateLimitKey("register", req), {
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await req.json().catch(() => null);
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError =
        Object.values(validation.error.flatten().fieldErrors)
          .flat()
          .filter(Boolean)[0] || "Dados inválidos.";

      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      name,
      email,
      password,
      termsAccepted,
      privacyAccepted,
      lgpdAccepted,
    } = validation.data;

    const normalizedEmail = email.trim().toLowerCase();

    if (!termsAccepted || !privacyAccepted || !lgpdAccepted) {
      return NextResponse.json(
        {
          error:
            "Para criar sua conta, aceite os Termos de Uso, a Política de Privacidade e o consentimento LGPD.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Este e-mail já está cadastrado. Clique em Entrar para acessar sua conta.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const acceptedAt = new Date();
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "CLIENT",
        lgpdAccepted: true,
        lgpdAcceptedAt: acceptedAt,
        termsAcceptedAt: acceptedAt,
        privacyAcceptedAt: acceptedAt,
        legalAcceptedVersion: LEGAL_VERSION,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    try {
      await prisma.legalAcceptanceLog.create({
        data: {
          userId: user.id,
          type: "REGISTER",
          termsVersion: LEGAL_VERSION,
          privacyVersion: LEGAL_VERSION,
          ip: clientIp,
          userAgent,
        },
      });
    } catch (logError) {
      console.error("Erro ao registrar aceite legal:", logError);
    }

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        message: "Conta criada e login realizado com sucesso.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Este e-mail já está cadastrado. Clique em Entrar para acessar sua conta.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível criar sua conta agora. Tente novamente em alguns instantes.",
      },
      { status: 500 }
    );
  }
}