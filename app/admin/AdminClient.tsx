"use client";

import Link from "next/link";
import AppNav from "@/components/AppNav";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

export default function AdminClient({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
          <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
            Painel administrativo
          </div>

          <h1 className="mt-4 text-3xl font-black sm:text-5xl">
            Administração DesenrolaGov
          </h1>

          <p className="mt-3 text-sm text-white/70">
            Bem-vindo, {user.name}. Gerencie pedidos, serviços, financeiro e
            métricas da operação.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/orders"
            className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-bold text-[var(--accent-green)]">
              Operação
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Pedidos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhe clientes, status e etapas dos atendimentos.
            </p>
          </Link>

          <Link
            href="/admin/services"
            className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-bold text-[var(--accent-green)]">
              Catálogo
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Serviços
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Gerencie preços, descrições e serviços disponíveis.
            </p>
          </Link>

          <Link
            href="/admin/finance"
            className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-bold text-[var(--accent-green)]">
              Receita
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Financeiro
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Veja faturamento, pagamentos e indicadores financeiros.
            </p>
          </Link>

          <Link
            href="/admin/metrics"
            className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-bold text-[var(--accent-green)]">
              Performance
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              Métricas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhe conversão, pedidos e evolução da operação.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}