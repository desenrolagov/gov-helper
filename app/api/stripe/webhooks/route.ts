import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/order-flow";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { paymentApprovedTemplate } from "@/lib/email-templates";

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type ProcessWebhookResult = {
  duplicate: boolean;
};

function getPaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null
): string | null {
  if (!paymentIntent) return null;
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent.id ?? null;
}

function isPaidSessionEvent(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): boolean {
  if (event.type === "checkout.session.async_payment_succeeded") {
    return true;
  }

  if (event.type === "checkout.session.completed") {
    return session.payment_status === "paid";
  }

  return false;
}

async function ensureStatusHistory(orderId: string, status: OrderStatus) {
  const existing = await prisma.orderStatusHistory.findFirst({
    where: { orderId, status },
    select: { id: true },
  });

  if (!existing) {
    await prisma.orderStatusHistory.create({
      data: { orderId, status },
    });
  }
}

async function ensureOrderPaidAndAwaitingDocuments(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) return;

  const currentStatus = order.status as OrderStatus;

  if (currentStatus === "CANCELLED" || currentStatus === "COMPLETED") {
    return;
  }

  await ensureStatusHistory(orderId, "PAID");

  if (currentStatus === "PROCESSING") {
    return;
  }

  if (currentStatus !== "AWAITING_DOCUMENTS") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "AWAITING_DOCUMENTS" },
    });
  }

  await ensureStatusHistory(orderId, "AWAITING_DOCUMENTS");
}

async function ensureOrderPendingIfNoPaidPayments(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      payments: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!order) return;

  const currentStatus = order.status as OrderStatus;

  if (currentStatus === "CANCELLED" || currentStatus === "COMPLETED") {
    return;
  }

  const hasPaid = order.payments.some(
    (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
  );

  if (hasPaid) {
    return;
  }

  if (currentStatus !== "PENDING_PAYMENT") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PENDING_PAYMENT" },
    });
  }

  await ensureStatusHistory(orderId, "PENDING_PAYMENT");
}

async function sendPaymentApprovedEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order?.user?.email) return;

    const html = paymentApprovedTemplate({
      name: order.user.name,
      orderId: order.id,
    });

    await sendEmail({
      to: order.user.email,
      subject: "Pagamento aprovado",
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar email de pagamento aprovado:", error);
  }
}

async function processEvent(event: Stripe.Event): Promise<ProcessWebhookResult> {
  const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true },
  });

  if (alreadyProcessed) {
    return { duplicate: true };
  }

  let approvedOrderId: string | null = null;
  let failedOrExpiredOrderId: string | null = null;

  await prisma.$transaction(async (tx: TxClient) => {
    await tx.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
      },
    });

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadataOrderId = session.metadata?.orderId || null;
      const paymentIntentId = getPaymentIntentId(session.payment_intent);
      const paidSession = isPaidSessionEvent(event, session);

      const existingPayment = await tx.payment.findFirst({
        where: {
          stripeSessionId: session.id,
        },
        select: {
          id: true,
          orderId: true,
          status: true,
        },
      });

      const orderId = metadataOrderId || existingPayment?.orderId || null;

      if (!orderId) {
        console.error("orderId não encontrado no webhook Stripe.", {
          eventId: event.id,
          sessionId: session.id,
          type: event.type,
        });
        return;
      }

      if (paidSession && session.payment_status === "paid") {
        await tx.payment.updateMany({
          where: {
            stripeSessionId: session.id,
          },
          data: {
            status: "PAID" as PaymentStatusValue,
            stripePaymentIntentId: paymentIntentId,
          },
        });

        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { id: true, status: true },
        });

        if (order) {
          const currentStatus = order.status as OrderStatus;

          if (currentStatus !== "CANCELLED" && currentStatus !== "COMPLETED") {
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: currentStatus === "PROCESSING" ? "PROCESSING" : "PAID",
              },
            });
          }
        }

        if (existingPayment?.status !== "PAID") {
          approvedOrderId = orderId;
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId || null;

      await tx.payment.updateMany({
        where: {
          stripeSessionId: session.id,
          status: "PENDING" as PaymentStatusValue,
        },
        data: {
          status: "EXPIRED" as PaymentStatusValue,
        },
      });

      if (orderId) {
        failedOrExpiredOrderId = orderId;
      }
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId = getPaymentIntentId(session.payment_intent);
      const orderId = session.metadata?.orderId || null;

      await tx.payment.updateMany({
        where: {
          stripeSessionId: session.id,
        },
        data: {
          status: "FAILED" as PaymentStatusValue,
          stripePaymentIntentId: paymentIntentId,
        },
      });

      if (orderId) {
        failedOrExpiredOrderId = orderId;
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const existingPayment = await tx.payment.findFirst({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        select: {
          orderId: true,
        },
      });

      await tx.payment.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        data: {
          status: "FAILED" as PaymentStatusValue,
        },
      });

      if (existingPayment?.orderId) {
        failedOrExpiredOrderId = existingPayment.orderId;
      }
    }
  });

  if (approvedOrderId) {
    await ensureOrderPaidAndAwaitingDocuments(approvedOrderId);
    await sendPaymentApprovedEmail(approvedOrderId);
  }

  if (failedOrExpiredOrderId) {
    await ensureOrderPendingIfNoPaidPayments(failedOrExpiredOrderId);
  }

  return { duplicate: false };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura Stripe ausente." },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurado." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Assinatura inválida no webhook Stripe:", error);

    return NextResponse.json(
      { error: "Assinatura Stripe inválida." },
      { status: 400 }
    );
  }

  try {
    const result = await processEvent(event);

    console.log("STRIPE_WEBHOOK_RECEIVED", {
      type: event.type,
      eventId: event.id,
      duplicate: result.duplicate,
      date: new Date().toISOString(),
    });

    return NextResponse.json(
      { received: true, duplicate: result.duplicate },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao processar webhook Stripe:", {
      type: event.type,
      eventId: event.id,
      error,
    });

    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}