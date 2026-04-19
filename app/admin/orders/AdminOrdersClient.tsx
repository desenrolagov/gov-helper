"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import AdminFinalDeliveryCard from "@/components/admin/AdminFinalDeliveryCard";
import OrderResultFilesList from "@/components/orders/OrderResultFilesList";
import {
  getAvailableOrderTransitions,
  getOrderClientMessage,
  getOrderStatusMeta,
  isValidOrderStatus,
  type OrderStatus,
  VALID_ORDER_STATUSES,
} from "@/lib/order-flow";

type UploadedFile = {
  id: string;
  originalName: string;
  url: string;
  createdAt: string;
};

type ResultFile = {
  id: string;
  originalName: string;
  url: string;
  createdAt: string;
};

type Order = {
  id: string;
  orderCode?: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  service: {
    id: string;
    name: string;
    price: number;
  };
  uploadedFiles: UploadedFile[];
  resultFiles?: ResultFile[];
};

const STATUS_OPTIONS: OrderStatus[] = [...VALID_ORDER_STATUSES];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getOrderStatusLabel(status: OrderStatus | string) {
  if (!isValidOrderStatus(status)) {
    return "Status inválido";
  }

  return getOrderStatusMeta(status).label;
}

function getAvailableStatusOptions(order: Order): OrderStatus[] {
  if (!isValidOrderStatus(order.status)) return [];

  return getAvailableOrderTransitions(order.status, {
    hasPaid: order.status !== "PENDING_PAYMENT",
    hasUploadedFiles: order.uploadedFiles.length > 0,
    hasResultFiles: (order.resultFiles?.length ?? 0) > 0,
  });
}

function getFlowHint(order: Order) {
  if (!isValidOrderStatus(order.status)) {
    return "Status inválido no pedido.";
  }

  if (order.status === "PAID") {
    return order.uploadedFiles.length > 0
      ? "Pagamento confirmado e documentos já recebidos. O pedido pode seguir para andamento."
      : "Pagamento confirmado. Agora o cliente precisa enviar os documentos.";
  }

  if (order.status === "AWAITING_DOCUMENTS") {
    return order.uploadedFiles.length > 0
      ? "Há documentos recebidos, mas ainda existem pendências ou necessidade de reenvio."
      : "Estamos aguardando o cliente enviar os documentos obrigatórios.";
  }

  if (order.status === "PROCESSING") {
    return (order.resultFiles?.length ?? 0) > 0
      ? "Pedido em execução com arquivo final já enviado. Agora a conclusão pode ser feita com segurança."
      : "Pedido em execução. Ao finalizar, envie o arquivo final ao cliente.";
  }

  if (order.status === "COMPLETED") {
    return (order.resultFiles?.length ?? 0) > 0
      ? "Pedido concluído com resultado final já liberado."
      : "Pedido marcado como concluído, mas sem arquivo final vinculado. Revise este caso.";
  }

  if (order.status === "CANCELLED") {
    return "Pedido cancelado. Nenhuma nova ação operacional é necessária.";
  }

  return getOrderClientMessage(order.status);
}

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao buscar pedidos.");
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setError("Erro ao buscar pedidos.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

async function updateStatus(id: string, status: OrderStatus) {
  try {
    setUpdatingId(id);
    setError("");
    setToast("");

    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = data?.error || "Erro ao atualizar status do pedido.";
      setError(message);
      setToast(message);
      return;
    }

    const updatedOrder = data && typeof data === "object" ? data : null;
    const updatedStatus = updatedOrder?.status ?? status;

    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? {
              ...order,
              ...updatedOrder,
              status: updatedStatus,
              uploadedFiles: Array.isArray(updatedOrder?.uploadedFiles)
                ? updatedOrder.uploadedFiles
                : order.uploadedFiles,
              resultFiles: Array.isArray(updatedOrder?.resultFiles)
                ? updatedOrder.resultFiles
                : order.resultFiles,
            }
          : order
      )
    );

    setToast("Status atualizado com sucesso.");

    await loadOrders();
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    setError("Erro ao atualizar status do pedido.");
    setToast("Erro ao atualizar status do pedido.");
  } finally {
    setUpdatingId(null);
  }
}

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      if (!isValidOrderStatus(order.status)) return false;

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesSearch =
        !term ||
        order.user.name.toLowerCase().includes(term) ||
        order.user.email.toLowerCase().includes(term) ||
        order.service.name.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term) ||
        (order.orderCode || "").toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const validOrders = orders.filter((order) => isValidOrderStatus(order.status));

    return {
      total: validOrders.length,
      pending: validOrders.filter((o) => o.status === "PENDING_PAYMENT").length,
      paid: validOrders.filter((o) => o.status === "PAID").length,
      awaiting: validOrders.filter((o) => o.status === "AWAITING_DOCUMENTS").length,
      processing: validOrders.filter((o) => o.status === "PROCESSING").length,
      completed: validOrders.filter((o) => o.status === "COMPLETED").length,
      cancelled: validOrders.filter((o) => o.status === "CANCELLED").length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          Carregando pedidos...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Administração
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:mt-4 sm:text-3xl">
            Painel de pedidos
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Gerencie o fluxo completo do pedido: pagamento, documentos,
            andamento, entrega final e conclusão.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                1. Localize rápido
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Busque por cliente, e-mail, código ou serviço.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                2. Atualize o status
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Siga apenas as transições válidas do fluxo.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                3. Entregue o resultado
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Envie o arquivo final e conclua o pedido.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Visão geral
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Em andamento</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.processing}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Concluídos</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {summary.completed}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-700">Pendências</p>
              <p className="mt-1 text-2xl font-bold text-red-900">
                {summary.awaiting}
              </p>
            </div>
          </div>
        </div>
      </section>

      {toast ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {toast}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">
        <input
          type="text"
          placeholder="Buscar por cliente, e-mail, serviço, código ou ID do pedido"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value === "ALL" ? "ALL" : (value as OrderStatus));
          }}
        >
          <option value="ALL">Todos os status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {getOrderStatusLabel(status)}
            </option>
          ))}
        </select>
      </section>

      {!error && filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-sm">
          Nenhum pedido encontrado com os filtros aplicados.
        </div>
      ) : null}

      <section className="grid gap-4">
        {filteredOrders.map((order) => {
          if (!isValidOrderStatus(order.status)) return null;

          const nextOptions = getAvailableStatusOptions(order);
          const expanded = expandedId === order.id;
          const canShowFinalDelivery =
            order.status === "PROCESSING" || order.status === "COMPLETED";

          return (
        <article
  key={order.id}
  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
>
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <OrderStatusBadge status={order.status} />
      <OrderCodeBadge
        code={order.orderCode}
        fallback={order.id.slice(0, 8).toUpperCase()}
      />
      <span className="text-xs text-slate-500">
        Criado em {formatDate(order.createdAt)}
      </span>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Cliente
            </p>
            <p className="truncate font-semibold text-slate-900">
              {order.user.name}
            </p>
            <p className="truncate text-sm text-slate-600">
              {order.user.email}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Serviço
            </p>
            <p className="text-sm font-semibold text-slate-900 sm:text-base">
              {order.service.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Valor</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(Number(order.totalAmount))}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Uploads</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {order.uploadedFiles.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Próximo passo</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {nextOptions.length > 0
                ? "Atualizar fluxo"
                : "Sem ação de status"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Leitura rápida do pedido
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {getFlowHint(order)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700">
            Operação
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            Use apenas as transições abaixo para evitar quebra de fluxo e retrabalho com o cliente.
          </p>
        </div>

        <select
          value=""
          disabled={updatingId === order.id || nextOptions.length === 0}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            updateStatus(order.id, value as OrderStatus);
          }}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {nextOptions.length > 0
              ? "Atualizar status"
              : "Sem transições disponíveis"}
          </option>
          {nextOptions.map((status) => (
            <option key={status} value={status}>
              {getOrderStatusLabel(status)}
            </option>
          ))}
        </select>

        {updatingId === order.id ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Atualizando status...
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Link
            href={`/admin/orders/${order.id}`}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Abrir detalhe admin
          </Link>

          <Link
            href={`/orders/${order.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Abrir visão do cliente
          </Link>

          <button
            type="button"
            onClick={() =>
              setExpandedId((current) =>
                current === order.id ? null : order.id
              )
            }
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {expanded ? "Fechar ações" : "Abrir ações do pedido"}
          </button>
        </div>
      </div>
    </div>
  </div>

              {expanded ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <h3 className="text-base font-semibold text-slate-900">
                        Documentos enviados pelo cliente
                      </h3>

                      {order.uploadedFiles.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                          Nenhum documento enviado até o momento.
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {order.uploadedFiles.map((file: UploadedFile) => (
                            <div
                              key={file.id}
                              className="rounded-2xl border border-slate-200 bg-white p-4"
                            >
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {file.originalName}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Enviado em {formatDate(file.createdAt)}
                                  </p>
                                </div>

                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Visualizar
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <OrderResultFilesList
                      orderId={order.id}
                      title="Arquivos finais já enviados"
                      description="Confira os arquivos finais vinculados a este pedido."
                    />
                  </div>

                  <div className="space-y-6">
                    {canShowFinalDelivery ? (
                      <AdminFinalDeliveryCard
                        orderId={order.id}
                        onUploaded={loadOrders}
                      />
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <h3 className="text-base font-semibold text-slate-900">
                          Entrega final do serviço
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          O envio do arquivo final aparece quando o pedido já
                          está em andamento ou concluído.
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                      <h3 className="text-base font-semibold text-slate-900">
                        Observação operacional
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Para evitar reclamações, mantenha o cliente sempre com o
                        status coerente com a etapa real: pago, documentos
                        pendentes, em andamento ou concluído.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}