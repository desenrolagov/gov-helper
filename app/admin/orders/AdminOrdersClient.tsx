"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const statusMeta: Record<
  string,
  { label: string; className: string }
> = {
  PENDING_PAYMENT: {
    label: "Aguardando pagamento",
    className: "bg-yellow-100 text-yellow-700",
  },
  PAID: {
    label: "Pagamento confirmado",
    className: "bg-green-100 text-green-700",
  },
  AWAITING_DOCUMENTS: {
    label: "Aguardando documentos",
    className: "bg-orange-100 text-orange-700",
  },
  WAITING_OPERATOR_SCHEDULE_REVIEW: {
    label: "Aguardando WhatsApp",
    className: "bg-blue-100 text-blue-700",
  },
  PROCESSING: {
    label: "Em andamento",
    className: "bg-purple-100 text-purple-700",
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-green-100 text-green-700",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700",
  },
};

type Order = {
  id: string;
  orderCode?: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  service: {
    name: string;
  };
};

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  

  async function loadOrders() {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(data);
        return;
      }

      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        return;
      }

      setOrders([]);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

const filtered = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();

  return orders
    .filter((order) => {
      const matchesSearch =
        !term ||
        order.user?.name?.toLowerCase().includes(term) ||
        order.user?.email?.toLowerCase().includes(term) ||
        order.service?.name?.toLowerCase().includes(term) ||
        order.status?.toLowerCase().includes(term) ||
        (order.orderCode || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(order.status).toUpperCase().trim() === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}, [orders, searchTerm, statusFilter]);

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

  return (
    <div className="space-y-6">
     <div className="rounded-3xl bg-white p-4 shadow-xl">
  <input
    placeholder="Buscar cliente, e-mail, serviço ou código"
    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[var(--accent-green)]"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>

{/* 👇 COLE AQUI */}
<div className="flex flex-wrap gap-2 mt-3">
  {[
    { label: "Todos", value: "ALL" },
    { label: "Pagamento", value: "PENDING_PAYMENT" },
    { label: "Documentos", value: "AWAITING_DOCUMENTS" },
    { label: "WhatsApp", value: "WAITING_OPERATOR_SCHEDULE_REVIEW" },
    { label: "Em andamento", value: "PROCESSING" },
    { label: "Concluídos", value: "COMPLETED" },
  ].map((btn) => (
    <button
      key={btn.value}
      onClick={() => setStatusFilter(btn.value)}
      className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
        statusFilter === btn.value
          ? "bg-[var(--accent-green)] text-white border-transparent"
          : "bg-white text-slate-600 border-slate-300"
      }`}
    >
      {btn.label}
    </button>
  ))}
</div>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 text-center text-slate-500 shadow-xl">
          Carregando pedidos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 text-center text-slate-500 shadow-xl">
          Nenhum pedido encontrado
        </div>
      ) : (
        filtered.map((order) => (
          <div
            key={order.id}
            className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl"
          >
            <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                      const meta =
                       statusMeta[order.status] || {
                           label: order.status,
                            className: "bg-slate-100 text-slate-700",
                               };

                              return (
                                 <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}
                                 >
                        {meta.label}
                            </span>
                              );
                          })()}

              {order.orderCode && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {order.orderCode}
                </span>
              )}
            </div>

            <h2 className="mt-4 text-lg font-black">{order.user.name}</h2>

            <p className="text-sm text-slate-600">{order.service.name}</p>

            <p className="mt-2 text-sm text-slate-600">
              {formatCurrency(order.totalAmount)} • {formatDate(order.createdAt)}
            </p>

            <div className="mt-4">
              <Link
                href={`/admin/orders/${order.id}`}
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                Ver pedido
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}