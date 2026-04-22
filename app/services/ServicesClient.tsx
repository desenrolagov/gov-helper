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
  description?: string | null;
  price: number;
  active: boolean;
  type?: string | null;
  highlights?: unknown;
  documents?: unknown;
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

function normalizeHighlights(input: unknown, serviceName: string) {
  if (Array.isArray(input)) {
    const values = input
      .filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
      .slice(0, 3);

    if (values.length) return values;
  }

  if (isCpfService(serviceName)) {
    return [
      "Atendimento privado completo",
      "Acompanhamento do início ao fim",
      "Processo simples e organizado",
    ];
  }

  return [
    "Fluxo organizado",
    "Pagamento seguro",
    "Suporte durante todo o processo",
  ];
}

function normalizeDocuments(input: unknown, serviceName: string) {
  if (Array.isArray(input)) {
    const values = input
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (typeof obj.label === "string" && obj.label.trim()) {
            return obj.label.trim();
          }
          if (typeof obj.name === "string" && obj.name.trim()) {
            return obj.name.trim();
          }
          if (typeof obj.key === "string" && obj.key.trim()) {
            return obj.key.trim();
          }
        }

        return null;
      })
      .filter((item): item is string => Boolean(item))
      .slice(0, 4);

    if (values.length) return values;
  }

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
      } catch (err) {
        console.error("Erro ao buscar serviços:", err);
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
      services.find((service: Service) => isCpfService(service.name)) ||
      services[0] ||
      null
    );
  }, [services]);

  const otherServices = useMemo(() => {
    if (!featuredService) return [];
    return services.filter((service: Service) => service.id !== featuredService.id);
  }, [services, featuredService]);

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
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
      setError("Erro inesperado ao criar pedido.");
    } finally {
      setCreatingOrderId(null);
    }
  }

  function renderLegalBlock(serviceId: string) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={legalAcceptedByService[serviceId] || false}
            onChange={(e) =>
              setLegalAcceptedByService((prev) => ({
                ...prev,
                [serviceId]: e.target.checked,
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
            </Link>
            .
          </span>
        </label>

        <p className="mt-3 text-xs text-slate-500">
          Versão legal vigente: {getLegalVersionLabel()}.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? <AppNav user={user} /> : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="rounded-3xl bg-[#041f4a] p-6 text-white shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Área do cliente • contratação rápida
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Escolha o serviço ideal e avance para o pagamento em poucos passos
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Atendimento privado com fluxo organizado, pagamento seguro,
              documentos centralizados e acompanhamento do pedido até a
              conclusão.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-100">
              <li>✔ Contratação rápida</li>
              <li>✔ Pagamento seguro</li>
              <li>✔ Envio de documentos no momento certo</li>
            </ul>

            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
              A DesenrolaGov é uma assessoria privada e não possui vínculo com
              órgãos públicos.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  const section = document.getElementById("servicos-disponiveis");
                  section?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                disabled={loading}
                className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Carregando..." : "Ver serviços disponíveis"}
              </button>

              <Link
                href="/orders"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ver meus pedidos
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Como funciona
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Uma jornada simples, rápida e clara
                </h2>
              </div>

              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Atendimento ativo
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  1. Escolha o serviço
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Veja a opção mais adequada para sua necessidade.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  2. Confirme a contratação
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Siga para o pagamento com ambiente seguro.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  3. Envie documentos e acompanhe
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Tudo fica centralizado no seu painel.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Atendimento privado
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Pagamento integrado
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Documentos centralizados
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Acompanhamento do pedido
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

        <section id="servicos-disponiveis" className="mt-14">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-blue-700">
              Serviços disponíveis
            </p>
            <h2 className="text-3xl font-black text-slate-900">
              Escolha a opção ideal para continuar
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Selecione abaixo e avance para a próxima etapa.
            </p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              Carregando serviços...
            </div>
          ) : services.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
              Nenhum serviço disponível no momento.
            </div>
          ) : (
            <>
              {featuredService ? (
                <div className="mt-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm ring-1 ring-blue-100">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Serviço principal
                    </span>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Mais procurado
                    </span>
                  </div>

                  <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900">
                        {featuredService.name}
                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-slate-700">
                        {normalizeHighlights(
                          featuredService.highlights,
                          featuredService.name
                        ).map((item) => (
                          <p key={item}>• {item}</p>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-2 text-4xl font-black text-slate-900">
                          {formatCurrency(featuredService.price)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Documentos normalmente solicitados
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                          {normalizeDocuments(
                            featuredService.documents,
                            featuredService.name
                          ).map((item) => (
                            <p key={item}>• {item}</p>
                          ))}
                        </div>
                      </div>

                      {renderLegalBlock(featuredService.id)}

                      <div className="mt-5">
                        <button
                          onClick={() => handleCreateOrder(featuredService.id)}
                          disabled={creatingOrderId === featuredService.id}
                          className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {creatingOrderId === featuredService.id
                            ? "Continuando..."
                            : "Escolher este serviço"}
                        </button>

                        <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                          Próxima etapa: seguir para pagamento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {otherServices.length > 0 ? (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-slate-900">
                    Outras opções disponíveis
                  </h3>

                  <div className="mt-4 grid gap-6 lg:grid-cols-2">
                    {otherServices.map((service: Service) => (
                      <div
                        key={service.id}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Serviço disponível
                          </span>

                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Ativo
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-bold text-slate-900">
                          {service.name}
                        </h3>

                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          {normalizeHighlights(service.highlights, service.name).map(
                            (item) => (
                              <p key={item}>• {item}</p>
                            )
                          )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Valor
                          </p>
                          <p className="mt-2 text-3xl font-black text-slate-900">
                            {formatCurrency(service.price)}
                          </p>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Documentos normalmente solicitados
                          </p>

                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            {normalizeDocuments(service.documents, service.name).map(
                              (item) => (
                                <p key={item}>• {item}</p>
                              )
                            )}
                          </div>
                        </div>

                        {renderLegalBlock(service.id)}

                        <div className="mt-5">
                          <button
                            onClick={() => handleCreateOrder(service.id)}
                            disabled={creatingOrderId === service.id}
                            className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {creatingOrderId === service.id
                              ? "Continuando..."
                              : "Escolher este serviço"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    </div>
  );
}