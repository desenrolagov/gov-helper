"use client";

import { useEffect, useState } from "react";

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
    total: number;
    paid: number;
    completed: number;
  };
};

type CardProps = {
  title: string;
  value: string | number;
};

export default function AdminMetricsDashboard() {
  const [data, setData] = useState<MetricsResponse | null>(null);

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((json: MetricsResponse) => setData(json))
      .catch((error) => {
        console.error("Erro ao carregar métricas:", error);
      });
  }, []);

  if (!data) {
    return <p>Carregando métricas...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card title="Pedidos" value={data.statusCounts.total} />
        <Card title="Pagos" value={data.statusCounts.paid} />
        <Card title="Concluídos" value={data.statusCounts.completed} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Tempo até pagar" value={`${data.metrics.avgTimeToPay} min`} />
        <Card title="Tempo até upload" value={`${data.metrics.avgTimeToUpload} min`} />
        <Card title="Tempo até conclusão" value={`${data.metrics.avgTimeToComplete} min`} />
      </div>

      <div className="rounded-2xl border bg-red-50 p-4">
        <p className="font-bold text-red-700">
          🚨 Pedidos travados: {data.metrics.stuckOrders}
        </p>
      </div>

      <div className="rounded-2xl border p-4">
        <p>Total: {data.conversion.total}</p>
        <p>Pagos: {data.conversion.paid}</p>
        <p>Concluídos: {data.conversion.completed}</p>
      </div>
    </div>
  );
}

function Card({ title, value }: CardProps) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}