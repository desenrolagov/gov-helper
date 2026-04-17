import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function formatDayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function buildDateRange(period: string, start?: string | null, end?: string | null) {
  const now = new Date();

  if (start || end) {
    return {
      startDate: start ? startOfDay(new Date(start)) : undefined,
      endDate: end ? endOfDay(new Date(end)) : undefined,
      label: "Período personalizado",
    };
  }

  switch (period) {
    case "7d":
      return {
        startDate: startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
        endDate: endOfDay(now),
        label: "Últimos 7 dias",
      };
    case "90d":
      return {
        startDate: startOfDay(new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000)),
        endDate: endOfDay(now),
        label: "Últimos 90 dias",
      };
    case "30d":
    default:
      return {
        startDate: startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)),
        endDate: endOfDay(now),
        label: "Últimos 30 dias",
      };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const { startDate, endDate, label } = buildDateRange(period, start, end);

    const payments = await prisma.payment.findMany({
      where: {
        status: "PAID" as PaymentStatusValue,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        order: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                codePrefix: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPaidOrders = new Set(payments.map((payment) => payment.orderId)).size;
    const averageTicket = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;

    const revenueByServiceMap = new Map<
      string,
      {
        serviceId: string;
        serviceName: string;
        codePrefix: string | null;
        revenue: number;
        payments: number;
        orders: Set<string>;
      }
    >();

    for (const payment of payments) {
      const serviceId = payment.order.service?.id || "unknown";
      const serviceName = payment.order.service?.name || "Serviço não identificado";
      const codePrefix = payment.order.service?.codePrefix || null;

      const current = revenueByServiceMap.get(serviceId) || {
        serviceId,
        serviceName,
        codePrefix,
        revenue: 0,
        payments: 0,
        orders: new Set<string>(),
      };

      current.revenue += payment.amount;
      current.payments += 1;
      current.orders.add(payment.orderId);

      revenueByServiceMap.set(serviceId, current);
    }

    const revenueByService = Array.from(revenueByServiceMap.values())
      .map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        codePrefix: item.codePrefix,
        revenue: item.revenue,
        payments: item.payments,
        orders: item.orders.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const revenueByDayMap = new Map<
      string,
      { key: string; label: string; revenue: number; payments: number }
    >();

    if (startDate && endDate) {
      const cursor = new Date(startDate);

      while (cursor <= endDate) {
        const key = formatDayKey(cursor);
        revenueByDayMap.set(key, {
          key,
          label: formatDayLabel(cursor),
          revenue: 0,
          payments: 0,
        });

        cursor.setDate(cursor.getDate() + 1);
      }
    }

    for (const payment of payments) {
      const key = formatDayKey(payment.createdAt);
      const existing = revenueByDayMap.get(key) || {
        key,
        label: formatDayLabel(payment.createdAt),
        revenue: 0,
        payments: 0,
      };

      existing.revenue += payment.amount;
      existing.payments += 1;

      revenueByDayMap.set(key, existing);
    }

    const revenueByDay = Array.from(revenueByDayMap.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    const recentPayments = payments.slice(0, 10).map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      createdAt: payment.createdAt,
      orderId: payment.orderId,
      orderCode: payment.order.orderCode,
      customerName: payment.order.user?.name || "Cliente",
      customerEmail: payment.order.user?.email || "",
      serviceName: payment.order.service?.name || "Serviço não identificado",
      status: payment.status,
    }));

    return NextResponse.json(
      {
        filters: {
          period,
          start: startDate?.toISOString() || null,
          end: endDate?.toISOString() || null,
          label,
        },
        summary: {
          totalRevenue,
          totalPaidOrders,
          totalPayments: payments.length,
          averageTicket,
        },
        revenueByService,
        revenueByDay,
        recentPayments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar dados financeiros:", error);

    return NextResponse.json(
      { error: "Erro ao carregar dados financeiros." },
      { status: 500 }
    );
  }
}