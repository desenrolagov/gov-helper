import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderActionButton from "@/components/OrderActionButton";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import { canCreateCheckoutForOrderStatus } from "@/lib/order-status";
import {
  getOrderFlow,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OrderPage({ params }: OrderPageProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.role !== "CLIENT") redirect("/admin/orders");

  const resolvedParams = await params;

  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      service: true,
      uploadedFiles: {
        orderBy: { createdAt: "desc" },
      },
      resultFiles: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order || order.userId !== user.id) redirect("/orders");

  if (!isValidOrderStatus(order.status)) redirect("/orders");

  const status = order.status as OrderStatus;

  if (canCreateCheckoutForOrderStatus(status)) {
    redirect(`/payment?orderId=${order.id}`);
  }

  const flow = getOrderFlow(status, {
    orderId: order.id,
    filesCount: order.uploadedFiles.length,
    resultFilesCount: order.resultFiles.length,
  });

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm font-bold text-white/75 underline hover:text-white"
          >
            ← Voltar para meus pedidos
          </Link>
        </div>

        <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <OrderStatusBadge status={status} />
                <OrderCodeBadge
                  code={order.orderCode ?? undefined}
                  fallback={order.id.slice(0, 8).toUpperCase()}
                />
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-950">
                {order.service.name}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {flow.clientMessage}
              </p>
            </div>

            <div className="w-full lg:max-w-xs">
              <OrderActionButton
                status={status}
                orderId={order.id}
                filesCount={order.uploadedFiles.length}
                resultFilesCount={order.resultFiles.length}
                className="w-full bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green-hover)]"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Valor do pedido
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Criado em
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Documentos enviados
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {order.uploadedFiles.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Arquivos finais
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {order.resultFiles.length}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs uppercase tracking-wide text-green-700">
              Próxima etapa
            </p>
            <p className="mt-2 text-base font-black text-green-900">
              {flow.nextStepLabel}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <h2 className="text-lg font-black text-slate-950">
              Documentos enviados por você
            </h2>

            {order.uploadedFiles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Você ainda não enviou documentos para este pedido.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {order.uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-bold text-slate-950">
                      {file.originalName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Enviado em {formatDate(file.createdAt)}
                    </p>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
                    >
                      Visualizar arquivo
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <h2 className="text-lg font-black text-slate-950">
              Resultado final do serviço
            </h2>

            {order.resultFiles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                O resultado final ainda não foi liberado.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {order.resultFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-2xl border border-green-200 bg-green-50 p-4"
                  >
                    <p className="text-sm font-bold text-green-900">
                      {file.originalName}
                    </p>

                    <p className="mt-1 text-xs text-green-700">
                      Liberado em {formatDate(file.createdAt)}
                    </p>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
                    >
                      Baixar arquivo
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}