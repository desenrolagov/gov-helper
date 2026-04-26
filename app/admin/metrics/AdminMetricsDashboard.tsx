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

  async function loadMetrics() {
    try {
      const res = await fetch("/api/admin/metrics", {
        cache: "no-store",
      });

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Erro métricas:", err);
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
      ["Aguardando docs", data.statusCounts.awaitingDocs],
      ["Em andamento", data.statusCounts.processing],
      ["Concluído", data.statusCounts.completed],
      ["Cancelado", data.statusCounts.cancelled],
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-[var(--primary-blue-strong)] p-6 text-white">
        Carregando métricas...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 text-white">
      
      {/* HEADER */}
      <section className="rounded-3xl bg-[var(--primary-blue-strong)] p-6 shadow-xl">
        <h1 className="text-3xl font-black">Métricas</h1>
        <p className="text-white/70 text-sm mt-2">
          Acompanhe conversão e performance do sistema
        </p>
      </section>

      {/* CARDS PRINCIPAIS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Pedidos" value={data.statusCounts.total} />
        <Card title="Pagos" value={data.statusCounts.paid} />
        <Card title="Concluídos" value={data.statusCounts.completed} />
        <Card title="Travados" value={data.metrics.stuckOrders} />
      </div>

      {/* TEMPOS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Tempo até pagar" value={formatMinutes(data.metrics.avgTimeToPay)} />
        <Card title="Tempo até upload" value={formatMinutes(data.metrics.avgTimeToUpload)} />
        <Card title="Tempo até conclusão" value={formatMinutes(data.metrics.avgTimeToComplete)} />
      </div>

      {/* ALERTA */}
      {data.metrics.stuckOrders > 0 && (
        <div className="rounded-2xl bg-red-500/20 border border-red-500/30 p-4">
          <p className="font-bold text-red-200">
            🚨 Pedidos travados: {data.metrics.stuckOrders}
          </p>
        </div>
      )}

      {/* CONVERSÃO */}
      <section className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
        <h2 className="font-black text-lg">Funil de conversão</h2>

        <div className="mt-4 space-y-3">
          <MetricRow label="Criados" value={data.conversion.totalOrders} percent="100%" />
          <MetricRow label="Pagos" value={data.conversion.paidOrders} percent={formatPercent(data.conversion.paymentConversionRate)} />
          <MetricRow label="Com upload" value={data.conversion.uploadedOrders} percent={formatPercent(data.conversion.uploadConversionRate)} />
          <MetricRow label="Concluídos" value={data.conversion.completedOrders} percent={formatPercent(data.conversion.completionRate)} />
        </div>
      </section>

      {/* STATUS */}
      <section className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
        <h2 className="font-black text-lg">Status dos pedidos</h2>

        <div className="mt-4 space-y-3">
          {statusList.map(([label, value]) => {
            const total = data.statusCounts.total || 1;
            const width = Math.max((Number(value) / total) * 100, 2);

            return (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{label}</span>
                  <span>{value}</span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full mt-1">
                  <div
                    className="h-3 bg-[var(--accent-green)] rounded-full"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* CARD */
function Card({ title, value }: CardProps) {
  return (
    <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
      <p className="text-xs text-slate-500 font-bold uppercase">{title}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  );
}

/* ROW */
function MetricRow({ label, value, percent }: any) {
  return (
    <div className="flex justify-between bg-slate-50 p-4 rounded-xl">
      <span className="font-bold">{label}</span>
      <span>{value} ({percent})</span>
    </div>
  );
}