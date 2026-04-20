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

  const legalAcceptedVersion = LEGAL_VERSION;

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
      setError("");

      const res = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setOrder(null);
        setError("Não foi possível carregar o pedido.");
        return;
      }

      const data: OrderResponse = await res.json();
      setOrder(data);

      const redirectPath = getRedirectPath(orderId, data?.status);

      if (redirectPath) {
        redirectingRef.current = true;
        router.replace(redirectPath);
        return;
      }
    } catch (err) {
      console.error("Erro ao carregar pedido:", err);
      setError("Erro ao carregar o pedido.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  const checkPaymentStatus = useCallback(async () => {
    if (!orderId || redirectingRef.current) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data: OrderResponse = await res.json();
      setOrder(data);

      const redirectPath = getRedirectPath(orderId, data?.status);

      if (redirectPath) {
        redirectingRef.current = true;
        router.replace(redirectPath);
        return;
      }
    } catch (err) {
      console.error("Erro ao verificar status do pagamento:", err);
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

  useEffect(() => {
    if (!success || !orderId || redirectingRef.current) {
      return;
    }

    clearPaymentPolling();

    pollingRef.current = setInterval(() => {
      void checkPaymentStatus();
    }, 3000);

    void checkPaymentStatus();

    return () => {
      clearPaymentPolling();
    };
  }, [success, orderId, checkPaymentStatus, clearPaymentPolling]);

  useEffect(() => {
    if (!order?.status || redirectingRef.current) return;

    if (shouldGoToUpload(order.status) || shouldGoToOrder(order.status)) {
      redirectToOrderStep(order.status);
    }
  }, [order?.status, redirectToOrderStep]);

  async function handleCreateCheckout() {
    try {
      setError("");

      if (!orderId) {
        setError("Pedido não informado.");
        return;
      }

      if (!termsAccepted || !privacyAccepted) {
        setError(
          "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar."
        );
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
          termsAccepted,
          privacyAccepted,
          legalAcceptedVersion,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Não foi possível iniciar o pagamento.");
        return;
      }

      if (!data?.url) {
        setError("URL de checkout não retornada.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Erro ao iniciar checkout:", err);
      setError("Erro inesperado ao iniciar pagamento.");
    } finally {
      setCreatingCheckout(false);
    }
  }

  const latestPayment = useMemo(() => {
    if (!order?.payments?.length) return null;

    return [...order.payments].sort((a, b) => {
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    })[0];
  }, [order?.payments]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-slate-600">Carregando pedido...</p>
      </main>
    );
  }

  if (!orderId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Pedido não informado.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagamento</h1>
          <p className="mt-1 text-sm text-slate-600">
            Revise as informações do pedido e continue para o checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {order?.orderCode ? (
            <OrderCodeBadge code={order.orderCode} fallback="—" />
          ) : null}

          <Link
            href={orderId ? `/orders/${orderId}` : "/orders"}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar ao pedido
          </Link>
        </div>
      </div>

      {success ? (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Pagamento recebido. Estamos confirmando o status do seu pedido...
        </div>
      ) : null}

      {canceled ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          O pagamento foi cancelado. Você pode tentar novamente abaixo.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Resumo do pedido
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Serviço</p>
              <p className="text-base font-semibold text-slate-900">
                {order?.service?.name || "Serviço não informado"}
              </p>
            </div>

            {order?.service?.description ? (
              <div>
                <p className="text-sm font-medium text-slate-500">Descrição</p>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {order.service.description}
                </p>
              </div>
            ) : null}

            <div>
              <p className="text-sm font-medium text-slate-500">Status atual</p>
              <p className="text-base font-semibold text-slate-900">
                {getStatusLabel(order?.status)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Valor</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(order?.totalAmount)}
              </p>
            </div>

            {latestPayment ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Último pagamento
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Status: {latestPayment.status}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Valor: {formatCurrency(latestPayment.amount)}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Confirmar pagamento
          </h2>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              Aceite jurídico vinculado à versão legal {getLegalVersionLabel()}.
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm leading-6 text-slate-700">
                Li e aceito os{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-slate-900 underline"
                >
                  Termos de Uso
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm leading-6 text-slate-700">
                Li e aceito a{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-slate-900 underline"
                >
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>

            <button
              type="button"
              onClick={handleCreateCheckout}
              disabled={creatingCheckout}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingCheckout ? "Redirecionando..." : "Ir para pagamento"}
            </button>

            <p className="text-xs text-slate-500">
              Após a confirmação do pagamento, você será encaminhado para a
              etapa correta do seu pedido automaticamente.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}