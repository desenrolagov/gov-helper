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
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
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
            className="mt-1 h-4 w-4 rounded border-slate-300 accent-[var(--accent-green)]"
          />

          <span className="text-sm leading-6 text-slate-700">
            Li e aceito os{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-bold text-slate-950 underline"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="font-bold text-slate-950 underline"
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
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      {user ? <AppNav user={user} /> : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
            <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Área do cliente • contratação rápida
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Escolha o serviço e avance para o pagamento em poucos passos
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
              Atendimento privado com fluxo organizado, pagamento seguro,
              documentos centralizados e acompanhamento do pedido até a
              conclusão.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li>✔ Contratação rápida</li>
              <li>✔ Pagamento seguro</li>
              <li>✔ Envio de documentos no momento certo</li>
            </ul>

            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
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
                className="rounded-2xl bg-[var(--accent-green)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-950/20 transition hover:bg-[var(--accent-green-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Carregando..." : "Ver serviços disponíveis"}
              </button>

              <Link
                href="/orders"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15"
              >
                Ver meus pedidos
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  Como funciona
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Uma jornada simples, rápida e clara
                </h2>
              </div>

              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                Atendimento ativo
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                ["1. Escolha o serviço", "Veja a opção mais adequada para sua necessidade."],
                ["2. Confirme a contratação", "Siga para o pagamento com ambiente seguro."],
                ["3. Envie documentos e acompanhe", "Tudo fica centralizado no seu painel."],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-bold text-slate-950">{title}</p>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Atendimento privado",
                "Pagamento integrado",
                "Documentos centralizados",
                "Acompanhamento do pedido",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700"
                >
                  ✔ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">
            <p className="font-bold">Erro</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <section id="servicos-disponiveis" className="mt-14">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-green-300">
              Serviços disponíveis
            </p>
            <h2 className="text-3xl font-black text-white">
              Escolha a opção ideal para continuar
            </h2>
            <p className="text-sm leading-6 text-white/70">
              Selecione abaixo e avance para a próxima etapa.
            </p>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 text-white/75 shadow-xl shadow-black/20">
              Carregando serviços...
            </div>
          ) : services.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 text-white/75 shadow-xl shadow-black/20">
              Nenhum serviço disponível no momento.
            </div>
          ) : (
            <>
              {featuredService ? (
                <div className="mt-6 rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      Serviço principal
                    </span>

                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      Mais procurado
                    </span>
                  </div>

                  <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <h3 className="text-3xl font-black text-slate-950">
                        {featuredService.name}
                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-slate-700">
                        {normalizeHighlights(
                          featuredService.highlights,
                          featuredService.name
                        ).map((item) => (
                          <p key={item}>✔ {item}</p>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-2 text-4xl font-black text-slate-950">
                          {formatCurrency(featuredService.price)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
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
                          className="w-full rounded-2xl bg-[var(--accent-green)] py-4 text-sm font-bold text-white shadow-lg shadow-green-950/20 transition hover:bg-[var(--accent-green-hover)] disabled:cursor-not-allowed disabled:opacity-60"
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
                  <h3 className="text-xl font-black text-white">
                    Outras opções disponíveis
                  </h3>

                  <div className="mt-4 grid gap-6 lg:grid-cols-2">
                    {otherServices.map((service: Service) => (
                      <div
                        key={service.id}
                        className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            Serviço disponível
                          </span>

                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                            Ativo
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-black text-slate-950">
                          {service.name}
                        </h3>

                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          {normalizeHighlights(service.highlights, service.name).map(
                            (item) => (
                              <p key={item}>✔ {item}</p>
                            )
                          )}
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Valor
                          </p>
                          <p className="mt-2 text-3xl font-black text-slate-950">
                            {formatCurrency(service.price)}
                          </p>
                        </div>

                        {renderLegalBlock(service.id)}

                        <div className="mt-5">
                          <button
                            onClick={() => handleCreateOrder(service.id)}
                            disabled={creatingOrderId === service.id}
                            className="w-full rounded-2xl bg-[var(--accent-green)] py-4 text-sm font-bold text-white shadow-lg shadow-green-950/20 transition hover:bg-[var(--accent-green-hover)] disabled:cursor-not-allowed disabled:opacity-60"
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