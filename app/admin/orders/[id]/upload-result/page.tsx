import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import AdminFinalDeliveryCard from "@/components/admin/AdminFinalDeliveryCard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ResultFileItem = {
  id: string;
  originalName: string | null;
  url: string;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function getNextAction(status: string) {
  switch (status) {
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos do cliente";
    case "PROCESSING":
      return "Processando pedido";
    case "COMPLETED":
      return "Pedido concluído";
    default:
      return "Atualizar fluxo";
  }
}

export default async function AdminUploadResultPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      service: true,
      resultFiles: {
        orderBy: { createdAt: "desc" },
      },
      uploadedFiles: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    redirect("/admin/orders");
  }

  const paid = order.payments.some(
    (payment: { status: string }) => payment.status === "PAID"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Painel Admin
              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                Enviar resultado {order.orderCode || order.id.slice(0, 8)}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-slate-500">
                  Cliente: {order.user.name} ({order.user.email})
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Serviço: {order.service?.name || "Serviço não informado"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href={`/admin/orders/${order.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar ao pedido
              </Link>

              <Link
                href={`/orders/${order.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Abrir visão do cliente
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Pagamento</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {paid ? "Confirmado" : "Pendente"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Uploads do cliente</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {order.uploadedFiles.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Resultados finais</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {order.resultFiles.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Próxima ação</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {getNextAction(order.status)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Resultado final do atendimento
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Envie o documento final que ficará disponível para o cliente.
              </p>

              <div className="mt-5">
                <AdminFinalDeliveryCard
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Resultados já enviados
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Histórico dos arquivos finais vinculados a este pedido.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {order.resultFiles.length} resultado
                  {order.resultFiles.length === 1 ? "" : "s"}
                </span>
              </div>

              {order.resultFiles.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Nenhum resultado final enviado ainda.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.resultFiles.map((file: ResultFileItem) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {file.originalName || "Arquivo final"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Enviado em: {formatDate(file.createdAt)}
                          </p>
                        </div>

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Visualizar resultado
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}