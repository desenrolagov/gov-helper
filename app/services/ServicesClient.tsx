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

type Props = {
  user: User | null;
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
    return ["Documento com foto", "CPF", "Comprovante relacionado ao caso"];
  }

  return ["Documento com foto", "CPF", "Comprovantes do atendimento"];
}

function isCpfService(serviceName: string) {
  return serviceName.toLowerCase().includes("cpf");
}

function getServiceSummary(serviceName: string) {
  if (isCpfService(serviceName)) {
    return "Atendimento privado com acompanhamento do início ao fim da regularização.";
  }

  return "Serviço com fluxo organizado, pagamento seguro e acompanhamento pela plataforma.";
}

export default function ServicesClient({ user }: Props) {
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

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setError(data?.error || "Erro ao buscar serviços.");
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
          "Para continuar, aceite os Termos de Uso e a Política de Privacidade no card do serviço."
        );
        return;
      }

      if (!user) {
        router.push(`/continue?serviceId=${serviceId}`);
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

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao criar pedido.");
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

  const featuredService = useMemo(() => {
    return (
      services.find((service) => isCpfService(service.name)) ||
      services[0] ||
      null
    );
  }, [services]);

  const otherServices = useMemo(() => {
    if (!featuredService) return [];
    return services.filter((service) => service.id !== featuredService.id);
  }, [services, featuredService]);

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? <AppNav user={user} /> : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Assessoria privada para regularização de CPF
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Regularize seu CPF com mais clareza, suporte e acompanhamento
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Resolva sua solicitação com um fluxo simples: contratação,
              pagamento, envio de documentos e acompanhamento em um só lugar.
            </p>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <strong>Atenção:</strong> a DesenrolaGov é uma assessoria privada
              e não possui vínculo com a Receita Federal ou outros órgãos do governo.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  if (featuredService) {
                    handleCreateOrder(featuredService.id);
                  }
                }}
                disabled={loading || !featuredService}
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Carregando..." : "Regularizar meu CPF agora"}
              </button>

              <button
                onClick={() => {
                  const section = document.getElementById("servico-destaque");
                  section?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver serviço disponível
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Solicitação simples
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Comece seu pedido sem burocracia desnecessária.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Documentos organizados
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Envie arquivos no local certo e acompanhe tudo.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Acompanhamento real
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Veja o andamento do pedido até a conclusão.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Fluxo organizado
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Uma jornada mais clara para regularização de CPF
                </h2>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Atendimento ativo
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  1. Contrate o serviço
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Inicie sua solicitação com uma estrutura simples e organizada.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  2. Faça o pagamento
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Confirme sua contratação em ambiente seguro.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  3. Envie e acompanhe
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Organize documentos e acompanhe o andamento pelo seu painel.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Pedido com acompanhamento
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Pagamento integrado
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Documentos centralizados
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Atendimento privado
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Erro</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <section className="mt-12">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Mais organização
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seu pedido, seus arquivos e o andamento do serviço ficam
                centralizados em um único lugar.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Mais clareza antes da contratação
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Veja valor, fluxo e próximas etapas antes de seguir para o
                pagamento.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Acompanhamento do pedido
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Saiba em que etapa sua solicitação está e o que precisa ser feito
                em seguida.
              </p>
            </div>
          </div>
        </section>

        <section id="servico-destaque" className="mt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                Serviço em destaque
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Comece pela regularização do CPF
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Contrate com mais confiança, entenda a proposta e siga para um
                fluxo organizado.
              </p>
            </div>

            {otherServices.length > 0 ? (
              <button
                onClick={() => {
                  const section = document.getElementById("todos-servicos");
                  section?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver todos os serviços
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              Carregando serviço...
            </div>
          ) : !featuredService ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
              Nenhum serviço disponível no momento.
            </div>
          ) : (
            <div className="mt-6 max-w-xl rounded-3xl border border-blue-200 bg-white p-6 shadow-sm ring-1 ring-blue-100">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Serviço principal
                </span>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Ativo
                </span>
              </div>

              <h3 className="mt-4 text-3xl font-bold text-slate-900">
                {featuredService.name}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {getServiceSummary(featuredService.name)}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Valor
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatCurrency(featuredService.price)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fluxo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Pedido, pagamento, envio e acompanhamento.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Documentos normalmente solicitados
                </p>

                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {getDefaultDocuments(featuredService.name).map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={legalAcceptedByService[featuredService.id] || false}
                    onChange={(e) =>
                      setLegalAcceptedByService((prev) => ({
                        ...prev,
                        [featuredService.id]: e.target.checked,
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
                    para continuar.
                  </span>
                </label>

                <p className="mt-3 text-xs text-slate-500">
                  Versão legal vigente: {getLegalVersionLabel()}.
                </p>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleCreateOrder(featuredService.id)}
                  disabled={creatingOrderId === featuredService.id}
                  className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingOrderId === featuredService.id
                    ? "Continuando..."
                    : "Começar agora"}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  {user
                    ? "Você seguirá para o checkout seguro do pedido."
                    : "Você criará seu acesso e seguirá direto para o pagamento."}
                </p>
              </div>
            </div>
          )}
        </section>

        {otherServices.length > 0 ? (
          <section id="todos-servicos" className="mt-14">
            <h2 className="text-2xl font-bold text-slate-900">
              Outros serviços disponíveis
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {otherServices.map((service) => {
                const accepted = legalAcceptedByService[service.id] || false;
                const isCreating = creatingOrderId === service.id;

                return (
                  <div
                    key={service.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {service.name}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Atendimento
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {getServiceSummary(service.name)}
                    </p>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Valor
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatCurrency(service.price)}
                      </p>
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
                          para continuar.
                        </span>
                      </label>
                    </div>

                    <button
                      onClick={() => handleCreateOrder(service.id)}
                      disabled={isCreating}
                      className="mt-4 w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreating ? "Continuando..." : "Contratar serviço"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-14 rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-300">
                Pronto para começar?
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Entre na DesenrolaGov e acompanhe seu pedido em um só lugar
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Solicite a regularização do CPF, envie arquivos, acompanhe as
                etapas e tenha mais clareza em todo o processo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {user ? (
                <button
                  onClick={() => router.push("/orders")}
                  className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Ver meus pedidos
                </button>
              ) : (
                <>
                  <button
                    onClick={() =>
                      featuredService
                        ? handleCreateOrder(featuredService.id)
                        : router.push("/services")
                    }
                    className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Começar agora
                  </button>

                  <button
                    onClick={() => router.push("/login")}
                    className="rounded-2xl border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}