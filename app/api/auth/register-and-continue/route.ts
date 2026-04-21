import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { LEGAL_VERSION } from "@/lib/legal";
import { createLegalLog } from "@/lib/legal-log";
import {
  buildRateLimitKey,
  createRateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";

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
    const rateLimitResult = rateLimit(buildRateLimitKey("register_continue", req), {
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body = await req.json().catch(() => null);

    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body?.password === "string" ? body.password : "";
    const serviceId =
      typeof body?.serviceId === "string" ? body.serviceId.trim() : "";

    if (!name || !email || !password || !serviceId) {
      return NextResponse.json(
        { error: "Nome, e-mail, senha e serviço são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado. Faça login para continuar." },
        { status: 409 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        active: true,
        price: true,
      },
    });

    if (!service || !service.active) {
      return NextResponse.json(
        { error: "Serviço inválido ou indisponível." },
        { status: 404 }
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
        email: true,
        role: true,
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

    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        status: "PENDING_PAYMENT",
        totalAmount: service.price,
        legalAcceptedVersion: LEGAL_VERSION,
        privacyAccepted: true,
        termsAccepted: true,
        privacyAcceptedAt: acceptedAt,
        termsAcceptedAt: acceptedAt,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        message: "Cadastro concluído com sucesso.",
        orderId: order.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro em register-and-continue:", error);
    return NextResponse.json(
      { error: "Erro interno ao continuar atendimento." },
      { status: 500 }
    );
  }
}