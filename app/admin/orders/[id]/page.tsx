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

// (mantive TODAS suas funções auxiliares sem alteração)

export default async function AdminOrderDetailsPage({ params }: any) {
  const session = await verifySession();
  const user = await getCurrentUser();

  // ✅ CORREÇÃO AQUI
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

  const paid = order.payments.some(
    (p: any) => p.status === "PAID"
  );

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* HEADER */}
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

            <div>
              <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
                Painel administrativo
              </div>

              <h1 className="mt-3 text-2xl font-black">
                Pedido {order.orderCode || order.id.slice(0, 8)}
              </h1>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
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

        {/* MÉTRICAS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Valor</p>
            <p className="text-xl font-black">
              R$ {order.totalAmount}
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

        {/* CONTEÚDO */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

          {/* COLUNA ESQUERDA */}
          <div className="space-y-6">

            {/* DOCUMENTOS */}
            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="font-black text-lg">
                Documentos do cliente
              </h2>

              {order.uploadedFiles.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">
                  Nenhum documento enviado
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.uploadedFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border p-3 flex justify-between items-center"
                    >
                      <span className="text-sm font-medium">
                        {file.originalName}
                      </span>

                      <a
                        href={file.url}
                        target="_blank"
                        className="text-sm font-bold text-[var(--accent-green)]"
                      >
                        Abrir
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESULTADO */}
            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="font-black text-lg">
                Resultado final
              </h2>

              {order.resultFiles.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">
                  Nenhum resultado enviado
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.resultFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border p-3 flex justify-between items-center"
                    >
                      <span className="text-sm font-medium">
                        {file.originalName}
                      </span>

                      <a
                        href={file.url}
                        target="_blank"
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
                className="mt-4 inline-flex rounded-2xl bg-[var(--accent-green)] px-4 py-2 text-white text-sm font-bold"
              >
                Enviar resultado final
              </Link>
            </div>

          </div>

          {/* COLUNA DIREITA */}
          <div className="space-y-6">

            <AdminFinalDeliveryCard
              orderId={order.id}
              currentStatus={order.status}
            />

            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="font-black text-lg">
                Timeline do pedido
              </h2>

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