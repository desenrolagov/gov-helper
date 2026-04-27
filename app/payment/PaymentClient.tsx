"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import { LEGAL_VERSION } from "@/lib/legal";

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
      return "Em análise da equipe";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Carregando status";
  }
}

export default function PaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";
  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");

  const redirectingRef = useRef(false);

  useEffect(() => {
    async function load() {
      if (!orderId) {
        setError("Pedido não informado.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          if (success) {
            setError("");
            setLoading(false);

            setTimeout(() => {
              router.replace("/orders");
            }, 1800);

            return;
          }

          setError(data?.error || "Erro ao carregar pedido.");
          setOrder(null);
          setLoading(false);
          return;
        }

        setError("");
        setOrder(data);
      } catch {
        if (!success) {
          setError("Erro ao carregar pedido.");
        }
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [orderId, success, router]);

  useEffect(() => {
    if (!order || redirectingRef.current) return;

    if (order.status === "PAID" || order.status === "AWAITING_DOCUMENTS") {
      redirectingRef.current = true;
      router.replace(`/orders/${order.id}/upload`);
    }
  }, [order, router]);

  async function handleCheckout() {
    try {
      setError("");

      if (!orderId) {
        setError("Pedido não informado.");
        return;
      }

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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao iniciar pagamento.");
        return;
      }

      if (!data?.url) {
        setError("URL de checkout não recebida.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Erro inesperado ao iniciar pagamento.");
    } finally {
      setCreatingCheckout(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20">
          <p className="text-sm text-white/70">Carregando pagamento...</p>
        </div>
      </main>
    );
  }

  if (success && !order) {
    return (
      <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-green-400/30 bg-green-400/10 p-6 shadow-xl">
          <h1 className="text-3xl font-black">Pagamento identificado</h1>
          <p className="mt-3 text-sm leading-6 text-green-100">
            Estamos atualizando seu pedido. Você será direcionado para a área de
            pedidos em instantes.
          </p>

          <Link
            href="/orders"
            className="mt-6 inline-flex rounded-2xl bg-[var(--accent-green)] px-5 py-3 text-sm font-black text-white"
          >
            Ver meus pedidos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
            <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Etapa de pagamento
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Finalize seu pagamento
            </h1>

            <ul className="mt-5 space-y-3 text-sm text-white/80">
              <li>✔ Pagamento seguro</li>
              <li>✔ Liberação imediata do atendimento</li>
              <li>✔ Próxima etapa: envio de documentos</li>
            </ul>

            <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              A DesenrolaGov é uma assessoria privada e não possui vínculo com
              órgãos públicos.
            </p>

            {success && !error ? (
              <div className="mt-6 rounded-2xl border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-200">
                Pagamento identificado. Estamos atualizando seu pedido.
              </div>
            ) : null}

            {canceled ? (
              <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Pagamento cancelado. Você pode tentar novamente.
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl sm:p-8">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Resumo do pedido
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {order?.service?.name || "Serviço"}
                </h2>
              </div>

              {order?.orderCode ? <OrderCodeBadge code={order.orderCode} /> : null}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Valor</p>
                <p className="mt-1 text-4xl font-black text-slate-950">
                  {formatCurrency(order?.totalAmount)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Status</p>
                <p className="mt-1 text-sm font-bold text-[var(--primary-blue)]">
                  {getStatusLabel(order?.status)}
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Aceito os{" "}
                  <Link href="/terms" className="font-bold text-slate-950 underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacy" className="font-bold text-slate-950 underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={creatingCheckout || !acceptedLegal}
                className="w-full rounded-2xl bg-[var(--accent-green)] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-green-950/20 transition hover:bg-[var(--accent-green-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingCheckout ? "Redirecionando..." : "Pagar agora"}
              </button>

              <Link
                href="/orders"
                className="block text-center text-sm font-semibold text-slate-600 underline"
              >
                Ver meus pedidos
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}