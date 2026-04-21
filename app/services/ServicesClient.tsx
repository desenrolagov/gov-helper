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

function isCpfService(serviceName: string) {
  return serviceName.toLowerCase().includes("cpf");
}

function getShortServiceSummary(serviceName: string) {
  if (isCpfService(serviceName)) {
    return "Atendimento privado com acompanhamento do início ao fim.";
  }

  return "Fluxo organizado com pagamento seguro e acompanhamento.";
}

function getSuggestedDocuments(serviceName: string) {
  if (isCpfService(serviceName)) {
    return ["Documento com foto", "CPF", "Comprovante relacionado ao caso"];
  }

  return ["Documento com foto", "CPF", "Comprovantes do atendimento"];
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

  const featuredService = useMemo(() => {
    return (
      services.find((service) => isCpfService(service.name)) ||
      services[0] ||
      null
    );
  }, [services]);

  async function handleCreateOrder(serviceId: string) {
    try {
      setError("");

      if (!legalAcceptedByService[serviceId]) {
        setError(
          "Para continuar, aceite os Termos de Uso e a Política de Privacidade."
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

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? <AppNav user={user} /> : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
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
              e não possui vínculo com a Receita Federal ou outros órgãos do
              governo.
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
                  const section = document.getElementById("servico-principal");
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

        <section id="servico-principal" className="mt-14">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              Serviço disponível
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Regularização de CPF
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Escolha o serviço e siga direto para a próxima etapa.
            </p>
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
                {getShortServiceSummary(featuredService.name)}
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Valor
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatCurrency(featuredService.price)}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Documentos normalmente solicitados
                </p>

                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {getSuggestedDocuments(featuredService.name).map((item) => (
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
                  Próxima etapa: continuar o atendimento.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}