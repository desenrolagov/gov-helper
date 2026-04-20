import Link from "next/link";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SupportAssistant from "@/components/support/SupportAssistant";
import { type SupportStage, getSupportStageLabel } from "@/lib/support";

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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Central de suporte
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ajuda por etapa do atendimento
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Tire dúvidas frequentes, entenda a próxima etapa do seu pedido e
            receba orientações rápidas com base no status atual do atendimento.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Como funciona
              </p>

              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <p>• Consulte dúvidas comuns sem sair da plataforma.</p>
                <p>• Veja orientações compatíveis com a etapa do seu pedido.</p>
                <p>• Use o assistente para respostas rápidas e objetivas.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Etapa atual
              </p>

              <p className="mt-2 text-lg font-semibold text-slate-900">
                {getSupportStageLabel(stage)}
              </p>

              {latestOrder ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Pedido recente:{" "}
                    {latestOrder.orderCode || latestOrder.id.slice(0, 8)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Serviço: {latestOrder.serviceName || "Serviço não informado"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Status: {latestOrder.status}
                  </p>

                  <Link
                    href={`/orders/${latestOrder.id}`}
                    className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Abrir pedido
                  </Link>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                  Você ainda não tem um pedido recente vinculado ao suporte.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <SupportAssistant stage={stage} />
        </section>
      </div>
    </main>
  );
}