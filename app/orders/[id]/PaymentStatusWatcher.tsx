"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "AWAITING_DOCUMENTS"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

type Props = {
  orderId: string;
  payment?: string;
  status: OrderStatus;
};

type StatusResponse = {
  id: string;
  status: OrderStatus;
  totalAmount?: number;
  updatedAt?: string;
};

const MAX_ATTEMPTS = 12;
const INTERVAL_MS = 2500;

function isPostPaymentStatus(status: OrderStatus) {
  return (
    status === "PAID" ||
    status === "AWAITING_DOCUMENTS" ||
    status === "PROCESSING" ||
    status === "COMPLETED"
  );
}

function getStatusLabel(status: OrderStatus) {
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
      return "Status não identificado";
  }
}

export function PaymentStatusWatcher({ orderId, payment, status }: Props) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const isRequestRunningRef = useRef(false);

  const [attempts, setAttempts] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(status);
  const [lastError, setLastError] = useState<string | null>(null);

  const shouldWatch = useMemo(() => {
    return payment === "success" && status === "PENDING_PAYMENT";
  }, [payment, status]);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  useEffect(() => {
    if (!shouldWatch || !orderId) return;

    let isMounted = true;

    function clearWatcher() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function stopWatcher(markTimedOut = false) {
      clearWatcher();

      if (!isMounted) return;

      setIsChecking(false);

      if (markTimedOut) {
        setHasTimedOut(true);
      }
    }

    async function checkStatus() {
      if (isRequestRunningRef.current) return;

      isRequestRunningRef.current = true;

      try {
        if (!isMounted) return;

        setLastError(null);

        const res = await fetch(`/api/orders/${orderId}/status`, {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401 || res.status === 403) {
          stopWatcher(true);
          setLastError(
            "Sua sessão expirou ou o acesso a este pedido foi negado. Atualize a página e entre novamente."
          );
          return;
        }

        if (!res.ok) {
          throw new Error("Falha ao consultar status do pedido.");
        }

        const data: StatusResponse = await res.json();

        if (!isMounted) return;

        setCurrentStatus(data.status);

        if (isPostPaymentStatus(data.status)) {
          setHasConfirmed(true);
          setHasTimedOut(false);
          stopWatcher(false);

          if (data.status === "PAID" || data.status === "AWAITING_DOCUMENTS") {
            router.replace(`/orders/${orderId}/upload`);
            return;
          }

          if (data.status === "PROCESSING" || data.status === "COMPLETED") {
            router.replace(`/orders/${orderId}`);
            return;
          }
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("Erro ao verificar status do pagamento:", error);
        setLastError(
          "Não foi possível confirmar o pagamento agora. Vamos tentar novamente automaticamente."
        );
      } finally {
        isRequestRunningRef.current = false;
      }
    }

    setIsChecking(true);
    setHasTimedOut(false);
    setHasConfirmed(false);
    setLastError(null);
    attemptsRef.current = 0;
    setAttempts(0);

    void checkStatus();

    intervalRef.current = setInterval(() => {
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);

      void checkStatus();

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        stopWatcher(true);
      }
    }, INTERVAL_MS);

    return () => {
      isMounted = false;
      clearWatcher();
    };
  }, [orderId, router, shouldWatch]);

  if (!shouldWatch) {
    return null;
  }

  const progressPercentage = Math.min((attempts / MAX_ATTEMPTS) * 100, 100);

  return (
    <div className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-5 text-white shadow-xl shadow-black/20">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-green-400/30 bg-green-400/10 text-green-300">
          <span className="text-lg">
            {hasConfirmed ? "✅" : isChecking ? "⏳" : "ℹ️"}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-black text-white">
              {hasConfirmed
                ? "Pagamento confirmado com sucesso"
                : "Estamos confirmando seu pagamento"}
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-white/75">
              {hasConfirmed
                ? "O pedido foi atualizado e estamos levando você para a próxima etapa."
                : "Recebemos seu retorno do pagamento. A confirmação pode levar alguns instantes para aparecer no pedido."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-white/70">
              <span>
                {hasConfirmed
                  ? "Status atualizado"
                  : isChecking
                    ? "Verificação automática em andamento"
                    : "Verificação automática encerrada"}
              </span>

              <span>
                Tentativa {Math.min(attempts, MAX_ATTEMPTS)} de {MAX_ATTEMPTS}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-500"
                style={{
                  width: hasConfirmed ? "100%" : `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-green-300">
                Status atual
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {getStatusLabel(currentStatus)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-xs uppercase tracking-wide text-green-300">
                Situação
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {hasConfirmed
                  ? "Pedido atualizado"
                  : isChecking
                    ? "Aguardando confirmação"
                    : "Aguardando nova atualização"}
              </p>
            </div>
          </div>

          {isChecking && !hasConfirmed ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-sm font-bold text-white">
                Aguarde enquanto confirmamos o pagamento do seu pedido.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                Assim que a confirmação chegar, a página será atualizada
                automaticamente.
              </p>
            </div>
          ) : null}

          {hasTimedOut && !hasConfirmed ? (
            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3">
              <p className="text-sm font-bold text-yellow-100">
                A confirmação está demorando um pouco mais que o normal
              </p>
              <p className="mt-1 text-xs leading-relaxed text-yellow-100/80">
                Isso pode acontecer quando o sistema ainda está finalizando a
                comunicação do pagamento. Você pode atualizar a página em alguns
                instantes.
              </p>
            </div>
          ) : null}

          {lastError && !hasConfirmed ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-3">
              <p className="text-sm font-bold text-red-100">
                Houve uma falha temporária na verificação
              </p>
              <p className="mt-1 text-xs leading-relaxed text-red-100/80">
                {lastError}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-green-hover)]"
            >
              Atualizar agora
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}