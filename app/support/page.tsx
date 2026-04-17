import Link from "next/link";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SupportAssistant from "@/components/support/SupportAssistant";
import { type SupportStage } from "@/lib/support";

export const dynamic = "force-dynamic";

function mapOrderStatusToSupportStage(status?: string | null): SupportStage {
  switch (status) {
    case "PENDING_PAYMENT":
      return "PENDING_PAYMENT";
    case "PAID":
      return "PAID";
    case "AWAITING_DOCUMENTS":
      return "AWAITING_DOCUMENTS";
    case "PROCESSING":
      return "PROCESSING";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "GENERAL";
  }
}

export default async function SupportPage() {
  const session = await verifySession();

  let stage: SupportStage = "GENERAL";
  let latestOrder: {
    id: string;
    orderCode: string | null;
    status: string;
    serviceName: string | null;
  } | null = null;

  if (session?.userId) {
    const order = await prisma.order.findFirst({
      where: {
        userId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderCode: true,
        status: true,
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    if (order) {
      latestOrder = {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        serviceName: order.service?.name || null,
      };

      stage = mapOrderStatusToSupportStage(order.status);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Central de suporte
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Ajuda por etapa do atendimento
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Tire dúvidas frequentes e receba orientações rápidas com base na
              etapa atual do seu pedido.
            </p>
          </div>

          {latestOrder ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">
                Pedido recente:{" "}
                {latestOrder.orderCode || latestOrder.id.slice(0, 8)}
              </p>
              <p className="mt-1 text-slate-600">
                Serviço: {latestOrder.serviceName || "Serviço não informado"}
              </p>
              <p className="mt-1 text-slate-600">
                Status: {latestOrder.status}
              </p>

              <Link
                href={`/orders/${latestOrder.id}`}
                className="mt-3 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Abrir pedido
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <SupportAssistant stage={stage} />
    </main>
  );
}