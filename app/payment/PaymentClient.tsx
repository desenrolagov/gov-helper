"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import { LEGAL_VERSION, getLegalVersionLabel } from "@/lib/legal";

type PaymentStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_DOCUMENTS"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | string;

type OrderResponse = {
  id: string;
  orderCode?: string | null;
  status?: PaymentStatus;
  totalAmount?: number;
  service?: {
    name?: string | null;
  } | null;
  payments?: Array<{
    status: string;
    createdAt?: string;
  }>;
};

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return "Pagamento aprovado";
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos";
    case "PROCESSING":
      return "Em andamento";
    case "COMPLETED":
      return "Concluído";
    default:
      return "Status desconhecido";
  }
}

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");

  const redirectingRef = useRef(false);

  useEffect(() => {
    async function load() {
      if (!orderId) return;

      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);
      } catch {
        setError("Erro ao carregar pedido.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orderId]);

  async function handleCheckout() {
    try {
      if (!acceptedLegal) {
        setError("Aceite os termos para continuar.");
        return;
      }

      setCreatingCheckout(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          termsAccepted: true,
          privacyAccepted: true,
          legalAcceptedVersion: LEGAL_VERSION,
        }),
      });

      const data = await res.json();

      if (!data?.url) {
        setError("Erro ao iniciar pagamento.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Erro inesperado.");
    } finally {
      setCreatingCheckout(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl grid gap-6 lg:grid-cols-[1fr_1fr]">

        {/* ESQUERDA */}
        <section className="bg-white rounded-3xl p-6 shadow-sm">

          <h1 className="text-3xl font-black">
            Finalize seu pagamento
          </h1>

          <ul className="mt-4 max-w-md space-y-2 text-sm leading-7 text-slate-600">
            <li>• Pagamento seguro</li>
            <li>• Liberação imediata do atendimento</li>
            <li>• Próxima etapa: envio de documentos</li>
          </ul>

          <div className="mt-4 max-w-md bg-red-50 text-red-700 p-3 rounded-xl text-sm">
            Assessoria privada, sem vínculo com órgãos públicos.
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

        </section>

        {/* DIREITA */}
        <aside className="bg-white border-2 border-slate-900 rounded-3xl p-6">

          <h2 className="text-xl font-black">
            {order?.service?.name}
          </h2>

          <div className="mt-3 text-4xl font-black">
            {formatCurrency(order?.totalAmount)}
          </div>

          <div className="mt-3 text-sm text-slate-600">
            {getStatusLabel(order?.status)}
          </div>

          <label className="mt-5 flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
            />
            Aceito termos e política
          </label>

          <button
            onClick={handleCheckout}
            disabled={!acceptedLegal || creatingCheckout}
            className="mt-5 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold"
          >
            {creatingCheckout ? "Redirecionando..." : "Pagar agora"}
          </button>

          <Link
            href="/orders"
            className="block mt-3 text-center text-sm text-slate-500"
          >
            Ver meus pedidos
          </Link>

        </aside>
      </div>
    </main>
  );
}