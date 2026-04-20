import {
  buildRateLimitKey,
  createRateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { canCreateCheckoutForOrderStatus } from "@/lib/order-status";
import { LEGAL_VERSION } from "@/lib/legal";
import { createAuditLog } from "@/lib/audit";
import { createLegalLog } from "@/lib/legal-log";
import { getAppUrl } from "@/lib/app-url";

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

function buildCheckoutDescription(serviceName: string, orderCode: string) {
  const normalized = serviceName.toLowerCase();

  if (normalized.includes("cpf")) {
    return [
      "Assessoria privada para regularização de CPF.",
      "Atendimento 100% online.",
      `Pedido: ${orderCode}.`,
      "A DesenrolaGov não possui vínculo com órgãos do governo.",
    ].join(" ");
  }

  return [
    "Assessoria privada com atendimento online.",
    `Pedido: ${orderCode}.`,
    "Acompanhamento do fluxo dentro da plataforma.",
  ].join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(buildRateLimitKey("checkout", req), {
      limit: 8,
      windowMs: 60_000,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const orderId =
      typeof body?.orderId === "string" ? body.orderId.trim() : "";

    const termsAccepted = body?.termsAccepted === true;
    const privacyAccepted = body?.privacyAccepted === true;
    const legalAcceptedVersion =
      typeof body?.legalAcceptedVersion === "string"
        ? body.legalAcceptedVersion.trim()
        : "";

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json(
        {
          error:
            "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.",
        },
        { status: 400 }
      );
    }

    if (!legalAcceptedVersion) {
      return NextResponse.json(
        { error: "Versão legal não informada." },
        { status: 400 }
      );
    }

    if (legalAcceptedVersion !== LEGAL_VERSION) {
      return NextResponse.json(
        {
          error:
            "A versão legal enviada está desatualizada. Recarregue a página e confirme novamente os aceites.",
        },
        { status: 400 }
      );
    }

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

    if (!order.service) {
      return NextResponse.json(
        { error: "Serviço do pedido não encontrado." },
        { status: 400 }
      );
    }

    if (!canCreateCheckoutForOrderStatus(order.status)) {
      return NextResponse.json(
        { error: "Este pedido não pode mais gerar pagamento nesta etapa." },
        { status: 400 }
      );
    }

    const totalAmount = Number(order.totalAmount);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Valor do pedido inválido para pagamento." },
        { status: 400 }
      );
    }

    const unitAmount = Math.round(totalAmount * 100);

    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      return NextResponse.json(
        { error: "Valor do pedido inválido para checkout." },
        { status: 400 }
      );
    }

    const acceptedAt = new Date();
    const acceptedVersion = LEGAL_VERSION;
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    await prisma.order.update({
      where: { id: order.id },
      data: {
        termsAccepted: true,
        termsAcceptedAt: acceptedAt,
        privacyAccepted: true,
        privacyAcceptedAt: acceptedAt,
        legalAcceptedVersion: acceptedVersion,
      },
    });

    await createLegalLog({
      userId: user.id,
      orderId: order.id,
      type: "CHECKOUT",
      termsVersion: acceptedVersion,
      privacyVersion: acceptedVersion,
      ip: clientIp,
      userAgent,
    });

    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (
      existingPendingPayment?.checkoutUrl &&
      existingPendingPayment?.stripeSessionId
    ) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          existingPendingPayment.stripeSessionId
        );

        if (existingSession.status === "open" && existingSession.url) {
          await createAuditLog({
            action: "CHECKOUT_REUSED",
            entityType: "payment",
            entityId: existingPendingPayment.id,
            userId: user.id,
            orderId: order.id,
            message: "Checkout pendente reaproveitado.",
            metadata: {
              checkoutUrl: existingPendingPayment.checkoutUrl,
              stripeSessionId: existingPendingPayment.stripeSessionId,
              stripeSessionStatus: existingSession.status,
              legalAcceptedVersion: acceptedVersion,
              ip: clientIp,
              userAgent,
            },
          });

          return NextResponse.json(
            {
              url: existingPendingPayment.checkoutUrl,
              reused: true,
            },
            { status: 200 }
          );
        }

        await prisma.payment.update({
          where: { id: existingPendingPayment.id },
          data: {
            status: "FAILED",
          },
        });

        await createAuditLog({
          action: "CHECKOUT_EXPIRED",
          entityType: "payment",
          entityId: existingPendingPayment.id,
          userId: user.id,
          orderId: order.id,
          message:
            "Checkout anterior não estava mais aberto e foi marcado como cancelado.",
          metadata: {
            checkoutUrl: existingPendingPayment.checkoutUrl,
            stripeSessionId: existingPendingPayment.stripeSessionId,
            stripeSessionStatus: existingSession.status,
            legalAcceptedVersion: acceptedVersion,
            ip: clientIp,
            userAgent,
          },
        });
      } catch (stripeError) {
        console.error(
          "Erro ao verificar sessão Stripe existente. Nova sessão será criada.",
          stripeError
        );
      }
    }

    const baseUrl = getAppUrl();
    const orderCode = order.orderCode || order.id.slice(0, 8).toUpperCase();
    const checkoutDescription = buildCheckoutDescription(
      order.service.name,
      orderCode
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/payment?orderId=${order.id}&success=1`,
      cancel_url: `${baseUrl}/payment?orderId=${order.id}&canceled=1`,
      customer_email: user.email,
      metadata: {
        orderId: order.id,
        orderCode,
        userId: user.id,
        serviceId: order.serviceId,
        termsAccepted: "true",
        privacyAccepted: "true",
        legalAcceptedVersion: acceptedVersion,
      },
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: unitAmount,
            product_data: {
              name: `${order.service.name} • Pedido ${orderCode}`,
              description: checkoutDescription,
            },
          },
          quantity: 1,
        },
      ],
    });

    if (!session.url) {
      console.error("Stripe checkout criado sem URL de redirecionamento.", {
        orderId: order.id,
        sessionId: session.id,
      });

      return NextResponse.json(
        { error: "Não foi possível gerar a URL de pagamento." },
        { status: 500 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: "PENDING",
        stripeSessionId: session.id,
        checkoutUrl: session.url,
      },
    });

    await createAuditLog({
      action: "CHECKOUT_CREATED",
      entityType: "payment",
      entityId: payment.id,
      userId: user.id,
      orderId: order.id,
      message: "Checkout Stripe criado para o pedido.",
      metadata: {
        stripeSessionId: session.id,
        checkoutUrl: session.url,
        amount: totalAmount,
        orderCode,
        legalAcceptedVersion: acceptedVersion,
        reused: false,
        ip: clientIp,
        userAgent,
      },
    });

    return NextResponse.json(
      { url: session.url, reused: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao criar checkout:", error);

    return NextResponse.json(
      { error: "Erro ao criar checkout." },
      { status: 500 }
    );
  }
}