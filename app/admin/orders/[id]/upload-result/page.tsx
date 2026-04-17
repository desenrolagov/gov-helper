import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
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

export default async function AdminUploadResultPage({ params }: PageProps) {
  const session = await verifySession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
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

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  }

  const paid = order.payments.some(
    (payment: { status: string }) => payment.status === "PAID"
  );

  // ✅ NOVO — lógica correta da próxima ação
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Painel Admin</p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              <span className="text-slate-500">Enviar resultado</span>{" "}
              <span className="font-bold text-blue-600">
                {order.orderCode || order.id.slice(0, 8)}
              </span>
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Cliente: {order.user.name} ({order.user.email})
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Serviço: {order.service?.name || "Serviço não informado"}
            </p>

            <div className="mt-4">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/orders/${order.id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar ao pedido
            </Link>

            <Link
              href={`/orders/${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir visão do cliente
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Pagamento
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {paid ? "Confirmado" : "Pendente"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Uploads do cliente
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {order.uploadedFiles.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Resultados finais
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {order.resultFiles.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Próxima ação
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {getNextAction(order.status)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Resultado final do atendimento
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Envie o documento final que ficará disponível para o cliente.
            </p>
          </div>

          <AdminFinalDeliveryCard orderId={order.id} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Resultados já enviados
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Histórico dos arquivos finais vinculados a este pedido.
              </p>
            </div>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {order.resultFiles.length} resultado
              {order.resultFiles.length === 1 ? "" : "s"}
            </span>
          </div>

          {order.resultFiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Nenhum resultado final enviado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {order.resultFiles.map((file: ResultFileItem) => (
                <div
                  key={file.id}
                  className="rounded-2xl border border-green-200 bg-green-50/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                    >
                      Visualizar resultado
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}