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

function getLatestPaymentStatusLabel(status?: string) {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "PAID":
      return "Pago";
    case "FAILED":
      return "Falhou";
    case "EXPIRED":
      return "Expirado";
    default:
      return status || "Não identificado";
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
  const [error, setError] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);

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
    if (!success || !orderId || redirectingRef.current) return;

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

      if (!acceptedLegal) {
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
          termsAccepted: true,
          privacyAccepted: true,
          legalAcceptedVersion: LEGAL_VERSION,
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
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-sm font-medium text-slate-500">
              Carregando pedido...
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!orderId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-black text-slate-950">
              Pedido não informado
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Volte para a página inicial e reinicie o atendimento.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ir para o início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Etapa 2 de 2 • Pagamento seguro
          </div>
          <div className="hidden text-xs font-medium text-slate-500 sm:block">
            Próximo passo: envio de documentos
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Pagamento do atendimento
            </div>

            <h1 className="mt-4 max-w-md text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Finalize o pagamento para liberar a próxima etapa
            </h1>

            <p className="mt-3 max-w-md text-base leading-7 text-slate-600">
              Depois da confirmação do pagamento, seu pedido segue para envio de
              documentos e acompanhamento.
            </p>

            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Atenção: a DesenrolaGov é uma assessoria privada e não possui vínculo
              com a Receita Federal ou outros órgãos do governo.
            </div>

            {success ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Pagamento recebido. Estamos confirmando o status do seu pedido...
              </div>
            ) : null}

            {canceled ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                O pagamento foi cancelado. Você pode tentar novamente abaixo.
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {order?.orderCode ? <OrderCodeBadge code={order.orderCode} /> : null}

              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {getStatusLabel(order?.status)}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  1. Pagamento
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Você conclui em ambiente seguro.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  2. Confirmação
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  O sistema verifica o status automaticamente.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  3. Documentos
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Depois disso, você segue para upload e andamento.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-semibold text-slate-900">
                O que acontece após o pagamento?
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• Seu pagamento é confirmado em ambiente protegido.</li>
                <li>• O pedido avança automaticamente para a próxima etapa.</li>
                <li>• Você envia os documentos necessários para continuar.</li>
              </ul>
            </div>
          </section>

          <aside className="rounded-[28px] border-2 border-slate-900 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-500">
                  Resumo do pedido
                </div>
                <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950">
                  {order?.service?.name || "Serviço não informado"}
                </h2>
              </div>

              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Checkout seguro
              </div>
            </div>

            {order?.service?.description ? (
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {order.service.description}
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Situação atual
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {getStatusLabel(order?.status)}
                </div>

                {latestPayment ? (
                  <div className="mt-3 text-sm text-slate-600">
                    Última tentativa:{" "}
                    <span className="font-medium text-slate-900">
                      {getLatestPaymentStatusLabel(latestPayment.status)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-slate-600">
                    Pedido pronto para gerar checkout.
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 sm:min-w-[190px]">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Valor
                </div>
                <div className="mt-1 text-4xl font-black text-slate-950">
                  {formatCurrency(order?.totalAmount)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Você está a um passo de liberar a próxima etapa do atendimento.
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm leading-6 text-slate-700">
                Li e aceito os{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-slate-900 underline"
                >
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-slate-900 underline"
                >
                  Política de Privacidade
                </Link>
                .
                <span className="mt-1 block text-xs text-slate-500">
                  Versão legal vinculada: {getLegalVersionLabel()}.
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={handleCreateCheckout}
              disabled={creatingCheckout || !acceptedLegal}
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingCheckout ? "Redirecionando..." : "Ir para pagamento seguro"}
            </button>

            <div className="mt-3 text-center text-xs text-slate-500">
              Você será levado ao ambiente seguro de pagamento.
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <Link
                href="/orders"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver meus pedidos
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}