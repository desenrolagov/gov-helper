import {
  buildRateLimitKey,
  createRateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation";
import { LEGAL_VERSION } from "@/lib/legal";
import { createLegalLog } from "@/lib/legal-log";

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  const realIp = req.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

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
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      termsAccepted,
      privacyAccepted,
      lgpdAccepted,
    } = validation.data;

    if (!termsAccepted || !privacyAccepted || !lgpdAccepted) {
      return NextResponse.json(
        {
          error:
            "É obrigatório aceitar os Termos de Uso, a Política de Privacidade e o consentimento LGPD.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const acceptedAt = new Date();
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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
      },
    });

    await createLegalLog({
      userId: user.id,
      type: "REGISTER",
      termsVersion: LEGAL_VERSION,
      privacyVersion: LEGAL_VERSION,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}