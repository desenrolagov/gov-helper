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
  if (!isValidOrderStatus(status)) return "Status inválido";
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
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error);
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setError("Erro ao carregar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      setUpdatingId(id);

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error();

      setToast("Status atualizado");
      await loadOrders();
    } catch {
      setError("Erro ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return orders.filter((order) => {
      if (!isValidOrderStatus(order.status)) return false;

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      const matchesSearch =
        !term ||
        order.user.name.toLowerCase().includes(term) ||
        order.user.email.toLowerCase().includes(term) ||
        order.service.name.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
        Preparando pedidos...
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* FILTROS */}
      <section className="grid gap-4 rounded-3xl bg-white p-4 shadow-xl md:grid-cols-[1fr_220px]">
        <input
          placeholder="Buscar cliente, e-mail ou serviço"
          className="rounded-2xl border px-4 py-3 focus:border-[var(--accent-green)] outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="rounded-2xl border px-4 py-3 focus:border-[var(--accent-green)] outline-none"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as OrderStatus | "ALL")
          }
        >
          <option value="ALL">Todos</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {getOrderStatusLabel(s)}
            </option>
          ))}
        </select>
      </section>

      {/* LISTA */}
      {filteredOrders.map((order) => {
        const nextOptions = getAvailableStatusOptions(order);

        return (
          <div key={order.id} className="rounded-3xl bg-white p-5 shadow-xl">

            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <OrderCodeBadge code={order.orderCode} />
            </div>

            <h2 className="mt-3 font-bold text-slate-900">
              {order.user.name}
            </h2>

            <p className="text-sm text-slate-600">
              {order.service.name}
            </p>

            <div className="mt-3 text-sm text-slate-600">
              {formatCurrency(order.totalAmount)} •{" "}
              {formatDate(order.createdAt)}
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">

              <select
                onChange={(e) =>
                  updateStatus(order.id, e.target.value as OrderStatus)
                }
                className="rounded-2xl border px-3 py-2 text-sm"
              >
                <option>Atualizar status</option>
                {nextOptions.map((s) => (
                  <option key={s} value={s}>
                    {getOrderStatusLabel(s)}
                  </option>
                ))}
              </select>

              <Link
                href={`/admin/orders/${order.id}`}
                className="rounded-2xl border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Abrir
              </Link>

              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === order.id ? null : order.id
                  )
                }
                className="rounded-2xl bg-[var(--accent-green)] px-4 py-2 text-white text-sm"
              >
                {expandedId === order.id ? "Fechar" : "Ações"}
              </button>
            </div>

            {expandedId === order.id && (
              <div className="mt-4 space-y-4">

                <OrderResultFilesList orderId={order.id} />

                <AdminFinalDeliveryCard
                  orderId={order.id}
                  onUploaded={loadOrders}
                />

              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}