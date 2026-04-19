"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { LEGAL_VERSION, getLegalVersionLabel } from "@/lib/legal";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDefaultDocuments(serviceName: string) {
  const name = serviceName.toLowerCase();

  if (name.includes("cpf")) {
    return ["Documento com foto", "CPF", "Comprovante necessário do caso"];
  }

  return ["Documento com foto", "CPF", "Comprovantes do atendimento"];
}

function getServiceBadge(serviceName: string) {
  const name = serviceName.toLowerCase();

  if (name.includes("cpf")) {
    return "Serviço principal";
  }

  return "Atendimento";
}

export default function ServicesClient({ user }: { user: User }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOrderId, setCreatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [legalAcceptedByService, setLegalAcceptedByService] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/services", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Erro ao buscar serviços.");
          setServices([]);
          return;
        }

        const normalizedServices = Array.isArray(data)
          ? data.filter((service) => service?.active !== false)
          : [];

        setServices(normalizedServices);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        setError("Erro inesperado ao buscar serviços.");
        setServices([]);
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  async function handleCreateOrder(serviceId: string) {
    try {
      setError("");

      if (!legalAcceptedByService[serviceId]) {
        setError(
          "Para criar o pedido, aceite os Termos de Uso e a Política de Privacidade no card do serviço."
        );
        return;
      }

      setCreatingOrderId(serviceId);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          termsAccepted: true,
          privacyAccepted: true,
          legalVersion: LEGAL_VERSION,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar pedido.");
        return;
      }

      const orderId = data?.order?.id;

      if (!orderId) {
        setError("Pedido criado, mas o identificador não foi retornado.");
        return;
      }

      router.push(`/payment?orderId=${orderId}`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      setError("Erro inesperado ao criar pedido.");
    } finally {
      setCreatingOrderId(null);
    }
  }

  const serviceCountLabel = useMemo(() => {
    return `${services.length} serviço${services.length === 1 ? "" : "s"} disponível${
      services.length === 1 ? "" : "is"
    }`;
  }, [services.length]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mb-8">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                DesenrolaGov
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                Escolha o serviço para iniciar sua regularização
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Nossa oferta principal é a regularização de CPF com atendimento
                privado, fluxo organizado e acompanhamento do pedido em cada
                etapa.
              </p>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                <strong>Atenção:</strong> a DesenrolaGov é uma assessoria
                privada e não possui vínculo com órgãos do governo.
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    1. Contrate
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Gere seu pedido com poucos cliques.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    2. Pague com segurança
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Pagamento online com confirmação automática.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    3. Envie documentos
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Acompanhe tudo até a conclusão.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.refresh()}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Atualizar serviços
                </button>

                <button
                  onClick={() =>
                    router.push(user.role === "ADMIN" ? "/admin/orders" : "/orders")
                  }
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver meus pedidos
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Resumo
              </p>

              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900">
                  {loading ? "..." : services.length}
                </p>
                <p className="text-sm text-slate-600">
                  {loading ? "Carregando..." : serviceCountLabel}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Mais clareza antes da compra
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  Veja valor, documentos normalmente solicitados e próximas
                  etapas antes de seguir para o pagamento.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Serviço inicial recomendado
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Regularização de CPF
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Erro</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const isCreating = creatingOrderId === service.id;
            const suggestedDocuments = getDefaultDocuments(service.name);
            const accepted = legalAcceptedByService[service.id] || false;
            const isCpfService = service.name.toLowerCase().includes("cpf");

            return (
              <div
                key={service.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm sm:p-6 ${
                  isCpfService
                    ? "border-blue-200 ring-1 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {service.name}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isCpfService
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {getServiceBadge(service.name)}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {service.description}
                </p>

                <p className="mt-4 text-2xl font-bold text-slate-900">
                  {formatCurrency(service.price)}
                </p>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    O que esperar
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <p>• Pedido criado na hora</p>
                    <p>• Pagamento online com confirmação automática</p>
                    <p>• Upload dos documentos logo após o pagamento</p>
                    <p>• Acompanhamento dentro da área do cliente</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Documentos normalmente solicitados
                  </p>

                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {suggestedDocuments.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) =>
                        setLegalAcceptedByService((prev) => ({
                          ...prev,
                          [service.id]: e.target.checked,
                        }))
                      }
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
                      </Link>{" "}
                      e a{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-semibold text-slate-900 underline"
                      >
                        Política de Privacidade
                      </Link>{" "}
                      para criar este pedido.
                    </span>
                  </label>

                  <p className="mt-3 text-xs text-slate-500">
                    Versão legal vigente: {getLegalVersionLabel()}.
                  </p>
                </div>

                <button
                  onClick={() => handleCreateOrder(service.id)}
                  disabled={isCreating}
                  className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isCreating
                    ? "Criando pedido..."
                    : isCpfService
                    ? "Iniciar regularização"
                    : "Contratar serviço"}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Ao continuar, você verá o código do pedido, o valor da compra
                  e seguirá para o checkout seguro.
                </p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}