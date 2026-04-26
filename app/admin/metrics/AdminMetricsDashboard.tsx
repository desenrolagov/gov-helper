"use client";

import { useEffect, useMemo, useState } from "react";

type MetricsResponse = {
  statusCounts: {
    total: number;
    pendingPayment: number;
    paid: number;
    awaitingDocs: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  metrics: {
    avgTimeToPay: number;
    avgTimeToUpload: number;
    avgTimeToComplete: number;
    stuckOrders: number;
  };
  conversion: {
    totalOrders: number;
    paidOrders: number;
    uploadedOrders: number;
    completedOrders: number;
    paymentConversionRate: number;
    uploadConversionRate: number;
    completionRate: number;
  };
};

type CardProps = {
  title: string;
  value: string | number;
  description?: string;
};

function formatMinutes(value: number) {
  if (!value || value <= 0) return "0 min";

  if (value < 60) return `${value} min`;

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (minutes === 0) return `${hours}h`;

  return `${hours}h ${minutes}min`;
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function AdminMetricsDashboard() {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMetrics() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/metrics", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Erro ao carregar métricas.");
        setData(null);
        return;
      }

      setData(json as MetricsResponse);
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
      setError("Erro inesperado ao carregar métricas.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMetrics();
  }, []);

  const statusList = useMemo(() => {
    if (!data) return [];

    return [
      ["Aguardando pagamento", data.statusCounts.pendingPayment],
      ["Pago", data.statusCounts.paid],
      ["Aguardando documentos", data.statusCounts.awaitingDocs],
      ["Em andamento", data.statusCounts.processing],
      ["Concluído", data.statusCounts.completed],
      ["Cancelado", data.statusCounts.cancelled],
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 text-white shadow-xl shadow-black/20">
        <p className="text-sm text-white/70">Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 text-white shadow-xl shadow-black/20">
        <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
          Métricas operacionais
        </div>

        <h1 className="mt-4 text-3xl font-black">
          Painel de performance
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
          Acompanhe conversão, tempo médio por etapa, pedidos travados e
          distribuição de status da operação.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Pedidos totais"
              value={data.statusCounts.total}
              description="Todos os pedidos criados"
            />
            <Card
              title="Pagos"
              value={data.statusCounts.paid}
              description="Pedidos com status pago"
            />
            <Card
              title="Concluídos"
              value={data.statusCounts.completed}
              description="Pedidos finalizados"
            />
            <Card
              title="Travados"
              value={data.metrics.stuckOrders}
              description="Sem atualização há mais de 24h"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Card
              title="Tempo até pagar"
              value={formatMinutes(data.metrics.avgTimeToPay)}
              description="Média entre criação e pagamento"
            />
            <Card
              title="Tempo até upload"
              value={formatMinutes(data.metrics.avgTimeToUpload)}
              description="Média entre pagamento e primeiro envio"
            />
            <Card
              title="Tempo até conclusão"
              value={formatMinutes(data.metrics.avgTimeToComplete)}
              description="Média entre pagamento e resultado final"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
              <h2 className="text-xl font-black text-slate-950">
                Conversão do funil
              </h2>

              <div className="mt-5 grid gap-3">
                <MetricRow
                  label="Criados"
                  value={data.conversion.totalOrders}
                  percent="100%"
                />
                <MetricRow
                  label="Pagos"
                  value={data.conversion.paidOrders}
                  percent={formatPercent(data.conversion.paymentConversionRate)}
                />
                <MetricRow
                  label="Com upload"
                  value={data.conversion.uploadedOrders}
                  percent={formatPercent(data.conversion.uploadConversionRate)}
                />
                <MetricRow
                  label="Concluídos"
                  value={data.conversion.completedOrders}
                  percent={formatPercent(data.conversion.completionRate)}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
              <h2 className="text-xl font-black text-slate-950">
                Status dos pedidos
              </h2>

              <div className="mt-5 space-y-3">
                {statusList.map(([label, value]) => {
                  const total = data.statusCounts.total || 1;
                  const width = Math.max((Number(value) / total) * 100, 2);

                  return (
                    <div key={label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-700">
                          {label}
                        </span>
                        <span className="font-black text-slate-950">
                          {value}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full bg-[var(--accent-green)]"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Card({ title, value, description }: CardProps) {
  return (
    <div className="rounded-3xl bg-white p-5 text-[var(--text-dark)] shadow-xl">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function MetricRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: number;
  percent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{label}</p>
          <p className="text-xs text-slate-500">Quantidade: {value}</p>
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
          {percent}
        </span>
      </div>
    </div>
  );
}