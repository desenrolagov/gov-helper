import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderActionButton from "@/components/OrderActionButton";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import {
  getOrderFlow,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

export const dynamic = "force-dynamic";

type OrdersPageOrder = {
  id: string;
  orderCode: string | null;
  status: string;
  totalAmount: number;
  createdAt: Date;
  service: {
    name: string;
  };
  uploadedFiles: {
    id: string;
  }[];
  resultFiles: {
    id: string;
  }[];
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

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CLIENT") {
    redirect("/admin/orders");
  }

  const orders: OrdersPageOrder[] = await prisma.order.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      service: {
        select: {
          name: true,
        },
      },
      uploadedFiles: {
        select: {
          id: true,
        },
      },
      resultFiles: {
        select: {
          id: true,
        },
      },
    },
  });

  const validOrders = orders.filter((order) => isValidOrderStatus(order.status));

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-600">Área do cliente</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Meus pedidos
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhe o andamento dos seus pedidos e acesse rapidamente a
              próxima etapa de cada atendimento.
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Contratar novo serviço
          </Link>
        </div>

        {validOrders.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Você ainda não possui pedidos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Quando você contratar um serviço, seus pedidos aparecerão aqui para
              acompanhamento.
            </p>

            <div className="mt-6">
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ver serviços disponíveis
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-4">
            {validOrders.map((order) => {
              const status = order.status as OrderStatus;
              const flow = getOrderFlow(status, {
                orderId: order.id,
                filesCount: order.uploadedFiles.length,
                resultFilesCount: order.resultFiles.length,
              });

              return (
                <section
                  key={order.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <OrderStatusBadge status={status} />
                        <OrderCodeBadge
                          code={order.orderCode ?? undefined}
                          fallback={order.id.slice(0, 8).toUpperCase()}
                        />
                      </div>

                      <h2 className="mt-4 text-xl font-bold text-slate-900">
                        {order.service.name}
                      </h2>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Valor
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatCurrency(Number(order.totalAmount))}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Data do pedido
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Próxima etapa
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {flow.nextStepLabel}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {flow.clientMessage}
                      </p>
                    </div>

                    <div className="w-full lg:max-w-xs">
                      <div className="flex flex-col gap-3">
                        <OrderActionButton
                          status={status}
                          orderId={order.id}
                          filesCount={order.uploadedFiles.length}
                          resultFilesCount={order.resultFiles.length}
                          className="w-full"
                        />

                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Ver detalhes do pedido
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}