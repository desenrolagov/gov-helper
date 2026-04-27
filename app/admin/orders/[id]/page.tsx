import { getCurrentUser } from "@/lib/current-user";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import AdminOrderAuditTimeline from "@/components/admin/AdminOrderAuditTimeline";
import AdminFinalDeliveryCard from "@/components/admin/AdminFinalDeliveryCard";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function OperatorScheduleReviewCard({ order }: { order: any }) {
  const isWaiting =
    order.status === "WAITING_OPERATOR_SCHEDULE_REVIEW";

  if (!isWaiting) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-slate-900 shadow-xl">
      <p className="text-xs font-black uppercase tracking-wide text-amber-700">
        Atenção do operador
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">
        Localizar Poupatempo e horário
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        Este pedido já recebeu os documentos. Agora o operador deve verificar a
        unidade do Poupatempo mais próxima do cliente e informar o melhor horário
        disponível para foto e biometria.
      </p>

      <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
        <p className="font-black text-slate-950">Checklist:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Conferir endereço/cidade do cliente.</li>
          <li>Buscar unidade Poupatempo mais próxima.</li>
          <li>Verificar horários disponíveis.</li>
          <li>Enviar retorno ao cliente pela plataforma ou WhatsApp.</li>
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-950">
          Modelo de mensagem para o cliente:
        </p>

        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
          <p>Olá, identificamos a melhor opção para seu atendimento:</p>
          <p className="mt-2 font-bold">Poupatempo São José do Rio Preto</p>
          <p>📍 Centro</p>
          <p>🕒 Horário disponível: informar horário confirmado</p>
          <p className="mt-2">
            Compareça com os documentos originais para foto e biometria.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Após orientar o cliente, avance o pedido para “Em andamento” ou envie o
        resultado final quando aplicável.
      </p>
    </div>
  );
}

export default async function AdminOrderDetailsPage({ params }: any) {
  const session = await verifySession();
  const user = await getCurrentUser();

  if (!session || !user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      service: true,
      uploadedFiles: { orderBy: { createdAt: "desc" } },
      resultFiles: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      histories: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    redirect("/admin/orders");
  }

  const totalUploads = order.uploadedFiles.length;
  const totalResults = order.resultFiles.length;

  const paid = order.payments.some((p: any) => p.status === "PAID");

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
                Painel administrativo
              </div>

              <h1 className="mt-3 text-2xl font-black">
                Pedido {order.orderCode || order.id.slice(0, 8)}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-white/70">
                  {order.user.name} ({order.user.email})
                </span>
              </div>

              <p className="mt-2 text-sm text-white/70">
                Serviço: {order.service.name}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/orders/${order.id}`}
                target="_blank"
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10"
              >
                Ver cliente
              </Link>

              <Link
                href="/admin/orders"
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10"
              >
                Voltar
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Valor</p>
            <p className="text-xl font-black">
              {formatCurrency(Number(order.totalAmount))}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Pagamento</p>
            <p className="text-xl font-black">
              {paid ? "Confirmado" : "Pendente"}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Uploads</p>
            <p className="text-xl font-black">{totalUploads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Resultados</p>
            <p className="text-xl font-black">{totalResults}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <OperatorScheduleReviewCard order={order} />

            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="text-lg font-black">Documentos do cliente</h2>

              {order.uploadedFiles.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Nenhum documento enviado
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.uploadedFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border p-3"
                    >
                      <div>
                        <p className="text-sm font-bold">
                          {file.originalName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Tipo: {file.type || "Documento"}
                        </p>
                      </div>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-[var(--accent-green)]"
                      >
                        Abrir
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="text-lg font-black">Resultado final</h2>

              {order.resultFiles.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Nenhum resultado enviado
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.resultFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-2xl border p-3"
                    >
                      <span className="text-sm font-medium">
                        {file.originalName}
                      </span>

                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-[var(--accent-green)]"
                      >
                        Ver
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href={`/admin/orders/${order.id}/upload-result`}
                className="mt-4 inline-flex rounded-2xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white"
              >
                Enviar resultado final
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <AdminFinalDeliveryCard
              orderId={order.id}
              currentStatus={order.status}
            />

            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="text-lg font-black">Timeline do pedido</h2>

              <div className="mt-4">
                <AdminOrderAuditTimeline items={[]} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}