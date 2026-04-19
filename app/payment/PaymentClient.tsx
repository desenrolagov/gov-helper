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
    description?: string | null;
  } | null;
  payments?: Array<{
    id: string;
    status: string;
    amount: number;
    checkoutUrl?: string | null;
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
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Não identificado";
  }
}

function shouldGoToUpload(status?: string) {
  return status === "PAID" || status === "AWAITING_DOCUMENTS";
}

function shouldGoToOrder(status?: string) {
  return (
    status === "PROCESSING" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  );
}

function getRedirectPath(orderId: string, status?: string) {
  if (shouldGoToUpload(status)) {
    return `/orders/${orderId}/upload`;
  }
  if (shouldGoToOrder(status)) {
    return `/orders/${orderId}`;
  }
  return null;
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
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const redirectingRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPaymentPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const redirectToOrderStep = useCallback(
    (status?: string) => {
      if (!orderId) return;
      const redirectPath = getRedirectPath(orderId, status);
      if (!redirectPath) return;

      redirectingRef.current = true;
      clearPaymentPolling();
      router.replace(redirectPath);
    },
    [orderId, router, clearPaymentPolling]
  );

  const loadOrder = useCallback(async () => {
    if (!orderId || redirectingRef.current) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setError("Erro ao carregar pedido.");
        return;
      }

      const data: OrderResponse = await res.json();
      setOrder(data);

      const redirectPath = getRedirectPath(orderId, data?.status);
      if (redirectPath) {
        redirectingRef.current = true;
        router.replace(redirectPath);
      }
    } catch {
      setError("Erro ao carregar pedido.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Pedido não informado.");
      return;
    }
    void loadOrder();
  }, [orderId, loadOrder]);

  async function handleCreateCheckout() {
    try {
      setError("");

      if (!termsAccepted || !privacyAccepted) {
        setError("Aceite os termos para continuar.");
        return;
      }

      setCreatingCheckout(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!data?.url) {
        setError("Erro ao iniciar pagamento.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Erro ao iniciar pagamento.");
    } finally {
      setCreatingCheckout(false);
    }
  }

  const latestPayment = useMemo(() => {
    if (!order?.payments?.length) return null;
    return [...order.payments].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )[0];
  }, [order?.payments]);

  if (loading) {
    return <p className="p-6 text-sm">Carregando...</p>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pagamento seguro</h1>
        <p className="text-sm text-slate-600">
          Finalize sua regularização de CPF com segurança
        </p>
      </div>

      {/* AVISO */}
      <div className="mb-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
        A DesenrolaGov é uma assessoria privada e não possui vínculo com o governo.
      </div>

      {/* RESUMO */}
      <div className="rounded-2xl border p-5 bg-white mb-6">
        <p className="text-sm text-slate-500">Serviço</p>
        <p className="font-semibold text-lg">
          {order?.service?.name || "Regularização de CPF"}
        </p>

        <p className="mt-3 text-sm text-slate-500">Valor</p>
        <p className="text-2xl font-bold text-slate-900">
          {formatCurrency(order?.totalAmount)}
        </p>

        {latestPayment && (
          <p className="mt-2 text-xs text-slate-500">
            Último pagamento: {latestPayment.status}
          </p>
        )}
      </div>

      {/* CHECKBOX */}
      <div className="space-y-3 mb-4">
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          Aceito os{" "}
          <Link href="/terms" className="underline font-medium">
            Termos
          </Link>
        </label>

        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
          />
          Aceito a{" "}
          <Link href="/privacy" className="underline font-medium">
            Privacidade
          </Link>
        </label>
      </div>

      {/* BOTÃO */}
      <button
        onClick={handleCreateCheckout}
        className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
      >
        {creatingCheckout ? "Redirecionando..." : "Pagar agora com segurança"}
      </button>

      {/* SEGURANÇA */}
      <p className="mt-3 text-xs text-center text-slate-500">
        Ambiente seguro • Pagamento criptografado • Atendimento garantido
      </p>

      {error && (
        <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
      )}
    </main>
  );
}