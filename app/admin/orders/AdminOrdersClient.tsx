"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  orderCode?: string;
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

  async function loadOrders() {
    const res = await fetch("/api/admin/orders", {
      cache: "no-store",
    });

    const data = await res.json();
    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = orders.filter((order) => {
    const term = searchTerm.toLowerCase();

    return (
      order.user.name.toLowerCase().includes(term) ||
      order.user.email.toLowerCase().includes(term) ||
      order.service.name.toLowerCase().includes(term) ||
      (order.orderCode || "").toLowerCase().includes(term)
    );
  });

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
      
      {/* BUSCA */}
      <div className="rounded-3xl bg-white p-4 shadow-xl">
        <input
          placeholder="Buscar cliente, e-mail, serviço ou código"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[var(--accent-green)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 text-center text-slate-500 shadow-xl">
          Nenhum pedido encontrado
        </div>
      ) : (
        filtered.map((order) => (
          <div
            key={order.id}
            className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl"
          >
            {/* STATUS + CÓDIGO */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                {order.status}
              </span>

              {order.orderCode && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {order.orderCode}
                </span>
              )}
            </div>

            {/* CLIENTE */}
            <h2 className="mt-4 text-lg font-black">
              {order.user.name}
            </h2>

            <p className="text-sm text-slate-600">
              {order.service.name}
            </p>

            {/* INFO */}
            <p className="mt-2 text-sm text-slate-600">
              {formatCurrency(order.totalAmount)} • {formatDate(order.createdAt)}
            </p>

            {/* AÇÃO */}
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