import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

function avg(value: number, count: number) {
  if (!count) return 0;
  return Math.round(value / count / 1000 / 60);
}

export async function GET() {
  try {
    const session = await verifySession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        payments: {
          orderBy: { createdAt: "asc" },
        },
        uploadedFiles: {
          orderBy: { createdAt: "asc" },
        },
        resultFiles: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const statusCounts = {
      total: orders.length,
      pendingPayment: 0,
      paid: 0,
      awaitingDocs: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };

    let totalTimeToPay = 0;
    let totalTimeToUpload = 0;
    let totalTimeToComplete = 0;

    let countPay = 0;
    let countUpload = 0;
    let countComplete = 0;

    let stuckOrders = 0;
    let paidOrders = 0;
    let uploadedOrders = 0;
    let completedOrders = 0;

    const now = Date.now();

    for (const order of orders) {
      switch (order.status) {
        case "PENDING_PAYMENT":
          statusCounts.pendingPayment++;
          break;
        case "PAID":
          statusCounts.paid++;
          break;
        case "AWAITING_DOCUMENTS":
          statusCounts.awaitingDocs++;
          break;
        case "PROCESSING":
          statusCounts.processing++;
          break;
        case "COMPLETED":
          statusCounts.completed++;
          break;
        case "CANCELLED":
          statusCounts.cancelled++;
          break;
      }

      const paidPayment = order.payments.find(
        (payment: { status: PaymentStatusValue; createdAt: Date }) =>
          payment.status === "PAID"
      );

      const firstUpload = order.uploadedFiles[0];
      const firstResult = order.resultFiles[0];

      const hasPaid = Boolean(paidPayment);
      const hasUpload = Boolean(firstUpload);
      const hasResult = Boolean(firstResult);

      if (hasPaid) {
        paidOrders++;
        totalTimeToPay +=
          new Date(paidPayment!.createdAt).getTime() -
          new Date(order.createdAt).getTime();
        countPay++;
      }

      if (hasUpload) {
        uploadedOrders++;
        totalTimeToUpload +=
          new Date(firstUpload!.createdAt).getTime() -
          new Date(order.createdAt).getTime();
        countUpload++;
      }

      if (hasResult) {
        completedOrders++;
        totalTimeToComplete +=
          new Date(firstResult!.createdAt).getTime() -
          new Date(order.createdAt).getTime();
        countComplete++;
      }

      const isOperationallyOpen =
        order.status !== "COMPLETED" && order.status !== "CANCELLED";

      const isStuck =
        isOperationallyOpen &&
        now - new Date(order.updatedAt).getTime() > 24 * 60 * 60 * 1000;

      if (isStuck) {
        stuckOrders++;
      }
    }

    const paymentConversionRate = statusCounts.total
      ? Number(((paidOrders / statusCounts.total) * 100).toFixed(2))
      : 0;

    const uploadConversionRate = paidOrders
      ? Number(((uploadedOrders / paidOrders) * 100).toFixed(2))
      : 0;

    const completionRate = paidOrders
      ? Number(((completedOrders / paidOrders) * 100).toFixed(2))
      : 0;

    return NextResponse.json(
      {
        statusCounts,
        metrics: {
          avgTimeToPay: avg(totalTimeToPay, countPay),
          avgTimeToUpload: avg(totalTimeToUpload, countUpload),
          avgTimeToComplete: avg(totalTimeToComplete, countComplete),
          stuckOrders,
        },
        conversion: {
          totalOrders: statusCounts.total,
          paidOrders,
          uploadedOrders,
          completedOrders,
          paymentConversionRate,
          uploadConversionRate,
          completionRate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);

    return NextResponse.json(
      { error: "Erro ao carregar métricas." },
      { status: 500 }
    );
  }
}