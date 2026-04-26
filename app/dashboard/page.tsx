import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderActionButton from "@/components/OrderActionButton";
import {
  getOrderFlow,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.role !== "CLIENT") redirect("/admin/orders");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      service: true,
      uploadedFiles: true,
      resultFiles: true,
    },
  });

  const latestOrder = orders[0];

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-green-300">Área do cliente</p>
          <h1 className="mt-1 text-3xl font-black">Painel do cliente</h1>
          <p className="mt-2 text-sm text-white/70">
            Acompanhe seu atendimento, pedidos e documentos em um só lugar.
          </p>
        </div>

        {!latestOrder ? (
          <section className="rounded-3xl bg-white p-8 text-center text-[var(--text-dark)] shadow-xl">
            <h2 className="text-xl font-black text-slate-950">
              Nenhum pedido encontrado
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Quando você contratar um serviço, o acompanhamento aparecerá aqui.
            </p>

            <Link
              href="/services"
              className="mt-6 inline-flex rounded-2xl bg-[var(--accent-green)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
            >
              Ver serviços
            </Link>
          </section>
        ) : (
          (() => {
            if (!isValidOrderStatus(latestOrder.status)) return null;

            const status = latestOrder.status as OrderStatus;

            const flow = getOrderFlow(status, {
              orderId: latestOrder.id,
              filesCount: latestOrder.uploadedFiles.length,
              resultFilesCount: latestOrder.resultFiles.length,
            });

            return (
              <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--accent-green)]">
                      Último atendimento
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      {latestOrder.service.name}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {flow.clientMessage}
                    </p>
                  </div>

                  <OrderStatusBadge status={status} />
                </div>

                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-green-700">
                    Próxima etapa
                  </p>
                  <p className="mt-1 text-lg font-black text-green-900">
                    {flow.nextStepLabel}
                  </p>
                </div>

                <div className="mt-6">
                  <OrderActionButton
                    status={status}
                    orderId={latestOrder.id}
                    filesCount={latestOrder.uploadedFiles.length}
                    resultFilesCount={latestOrder.resultFiles.length}
                    className="w-full bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green-hover)]"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/orders"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Ver todos os pedidos
                  </Link>

                  <Link
                    href="/dashboard/documents"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Meus documentos
                  </Link>
                </div>
              </section>
            );
          })()
        )}
      </main>
    </div>
  );
}