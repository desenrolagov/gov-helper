"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LEGAL_VERSION, getLegalVersionLabel } from "@/lib/legal";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  active?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function isCpfService(name?: string | null) {
  return (name || "").toLowerCase().includes("cpf");
}

export default function ContinueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId") || "";

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadService() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/services", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setError(data?.error || "Não foi possível carregar o serviço.");
          setService(null);
          return;
        }

        const services = Array.isArray(data)
          ? data.filter((item) => item?.active !== false)
          : [];

        const selected =
          services.find((item: Service) => item.id === serviceId) ||
          services.find((item: Service) => isCpfService(item.name)) ||
          services[0] ||
          null;

        setService(selected);

        if (!selected) {
          setError("Nenhum serviço ativo foi encontrado.");
        }
      } catch (err) {
        console.error("Erro ao carregar serviço:", err);
        setError("Erro inesperado ao carregar o serviço.");
        setService(null);
      } finally {
        setLoading(false);
      }
    }

    void loadService();
  }, [serviceId]);

  const callbackUrl = useMemo(() => {
    if (service?.id) {
      return `/continue?serviceId=${service.id}`;
    }

    if (serviceId) {
      return `/continue?serviceId=${serviceId}`;
    }

    return "/continue";
  }, [service?.id, serviceId]);

  const loginHref = useMemo(() => {
    return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }, [callbackUrl]);

  const registerHref = useMemo(() => {
    return `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  }, [callbackUrl]);

  const submitDisabled = useMemo(() => {
    return loading || creatingOrder || !service || !acceptedLegal;
  }, [loading, creatingOrder, service, acceptedLegal]);

  async function handleContinue() {
    try {
      setError("");

      if (!service?.id) {
        setError("Serviço não encontrado.");
        return;
      }

      if (!acceptedLegal) {
        setError(
          "Para continuar, aceite os Termos de Uso e a Política de Privacidade."
        );
        return;
      }

      setCreatingOrder(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          termsAccepted: true,
          privacyAccepted: true,
          legalVersion: LEGAL_VERSION,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        router.push(loginHref);
        return;
      }

      if (res.status === 403) {
        setError(
          data?.error || "Sua conta atual não pode iniciar esse atendimento."
        );
        return;
      }

      if (!res.ok) {
        setError(data?.error || "Não foi possível continuar.");
        return;
      }

      const orderId = data?.order?.id;

      if (!orderId) {
        setError("Pedido criado, mas o identificador não foi retornado.");
        return;
      }

      router.replace(`/payment?orderId=${orderId}`);
      router.refresh();
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
      setError("Erro inesperado ao continuar o atendimento.");
    } finally {
      setCreatingOrder(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Continuação do atendimento
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Falta só confirmar para seguir ao pagamento
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Revise o serviço selecionado, aceite os termos legais e avance para
              o checkout sem passar por etapas desnecessárias.
            </p>

            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Atenção: a DesenrolaGov é uma assessoria privada e não possui vínculo
              com a Receita Federal ou outros órgãos do governo.
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  1. Confirmar
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Você valida a contratação em poucos segundos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  2. Pagar
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  O checkout seguro é aberto na próxima etapa.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  3. Enviar documentos
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Depois do pagamento, o pedido segue normalmente.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-sm font-semibold text-slate-500">
              Resumo do serviço
            </div>

            {loading ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                Carregando serviço...
              </div>
            ) : !service ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                Nenhum serviço disponível no momento.
              </div>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {service.name}
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {service.description ||
                    "Atendimento privado com organização do processo e acompanhamento do pedido."}
                </p>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Valor
                  </div>
                  <div className="mt-1 text-3xl font-black text-slate-950">
                    {formatCurrency(Number(service.price))}
                  </div>
                </div>

                <label className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
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
                      Versão legal vigente: {getLegalVersionLabel()}.
                    </span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={submitDisabled}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingOrder ? "Continuando..." : "Ir para pagamento"}
                </button>

                <div className="mt-4 text-center text-xs text-slate-500">
                  Ao continuar, o pedido é criado e o fluxo segue para o checkout.
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={loginHref}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Já tenho conta
                  </Link>

                  <Link
                    href={registerHref}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Criar conta
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}