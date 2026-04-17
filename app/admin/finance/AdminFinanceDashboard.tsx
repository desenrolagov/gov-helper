"use client";

import { useEffect, useMemo, useState } from "react";

type FinanceResponse = {
  filters: {
    period: string;
    start: string | null;
    end: string | null;
    label: string;
  };
  summary: {
    totalRevenue: number;
    totalPaidOrders: number;
    totalPayments: number;
    averageTicket: number;
  };
  revenueByService: Array<{
    serviceId: string;
    serviceName: string;
    codePrefix: string | null;
    revenue: number;
    payments: number;
    orders: number;
  }>;
  revenueByDay: Array<{
    key: string;
    label: string;
    revenue: number;
    payments: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    createdAt: string;
    orderId: string;
    orderCode: string | null;
    customerName: string;
    customerEmail: string;
    serviceName: string;
    status: string;
  }>;
};

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

export default function AdminFinanceDashboard() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFinance(selectedPeriod: string) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/finance?period=${selectedPeriod}`, {
        cache: "no-store",
      });

      const json = (await res.json()) as FinanceResponse | { error?: string };

      if (!res.ok) {
        setError(("error" in json && json.error) || "Erro ao carregar financeiro.");
        return;
      }

      setData(json as FinanceResponse);
    } catch (err) {
      console.error("Erro ao carregar financeiro:", err);
      setError("Erro inesperado ao carregar financeiro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFinance(period);
  }, [period]);

  const maxRevenueDay = useMemo(() => {
    if (!data?.revenueByDay?.length) return 0;
    return Math.max(...data.revenueByDay.map((item) => item.revenue), 0);
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Carregando painel financeiro...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Financeiro PRO</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Receita e pagamentos
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhe faturamento, ticket médio, receita por serviço e histórico
              recente de pagamentos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "90d", label: "90 dias" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  period === item.value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Receita total
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pedidos pagos
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {data.summary.totalPaidOrders}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Pagamentos
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {data.summary.totalPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Ticket médio
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(data.summary.averageTicket)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Receita por dia
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {data.filters.label}
                </p>
              </div>

              {data.revenueByDay.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Nenhum pagamento confirmado no período.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.revenueByDay.map((item) => {
                    const width =
                      maxRevenueDay > 0
                        ? Math.max((item.revenue / maxRevenueDay) * 100, 2)
                        : 0;

                    return (
                      <div key={item.key}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-700">
                            {item.label}
                          </span>
                          <span className="text-slate-900">
                            {formatCurrency(item.revenue)}
                          </span>
                        </div>

                        <div className="h-3 rounded-full bg-slate-100">
                          <div
                            className="h-3 rounded-full bg-slate-900 transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Receita por serviço
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Serviços com maior faturamento no período.
                </p>
              </div>

              {data.revenueByService.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Nenhum serviço faturado no período.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.revenueByService.map((item) => (
                    <div
                      key={item.serviceId}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {item.serviceName}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{item.orders} pedido{item.orders === 1 ? "" : "s"}</span>
                        <span>{item.payments} pagamento{item.payments === 1 ? "" : "s"}</span>
                      </div>

                      <p className="mt-3 text-lg font-bold text-slate-900">
                        {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Pagamentos recentes
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Últimos pagamentos confirmados vinculados aos pedidos.
              </p>
            </div>

            {data.recentPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Nenhum pagamento recente encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pedido
                      </th>
                      <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cliente
                      </th>
                      <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Serviço
                      </th>
                      <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Valor
                      </th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 text-sm font-semibold text-slate-900">
                          {payment.orderCode || payment.orderId.slice(0, 8)}
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-700">
                          <div>{payment.customerName}</div>
                          <div className="text-xs text-slate-500">
                            {payment.customerEmail}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-700">
                          {payment.serviceName}
                        </td>
                        <td className="py-3 pr-4 text-sm font-semibold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 text-sm text-slate-700">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}