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
  highlights?: string[] | null;
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

function normalizeHighlights(service?: Service | null) {
  if (!service?.highlights || !Array.isArray(service.highlights)) {
    return [
      "Atendimento completo",
      "Processo 100% online",
      "Suporte durante o atendimento",
    ];
  }

  return service.highlights.slice(0, 3);
}

export default function ContinueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId") || "";

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          setError(data?.error || "Erro ao carregar serviço.");
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
          setError("Nenhum serviço disponível no momento.");
        }
      } catch {
        setError("Erro inesperado ao carregar serviço.");
        setService(null);
      } finally {
        setLoading(false);
      }
    }

    void loadService();
  }, [serviceId]);

  const callbackUrl = useMemo(() => {
    if (service?.id) return `/continue?serviceId=${service.id}`;
    if (serviceId) return `/continue?serviceId=${serviceId}`;
    return "/continue";
  }, [service?.id, serviceId]);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const canSubmit =
    !loading &&
    !submitting &&
    !!service?.id &&
    !!name.trim() &&
    !!email.trim() &&
    password.length >= 6 &&
    acceptedLegal;

  async function createOrder(selectedServiceId: string) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: selectedServiceId,
        termsAccepted: true,
        privacyAccepted: true,
        legalVersion: LEGAL_VERSION,
      }),
    });

    const data = await res.json().catch(() => null);
    return { res, data };
  }

  async function registerUser() {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        lgpdAccepted: true,
        termsAccepted: true,
        privacyAccepted: true,
        legalAcceptedVersion: getLegalVersionLabel(),
      }),
    });

    const data = await res.json().catch(() => null);
    return { res, data };
  }

  async function loginUser() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await res.json().catch(() => null);
    return { res, data };
  }

  async function handleContinue() {
    try {
      setError("");

      if (!service?.id) {
        setError("Serviço não encontrado.");
        return;
      }

      if (!name.trim() || !email.trim() || !password) {
        setError("Preencha nome, email e senha.");
        return;
      }

      if (password.length < 6) {
        setError("A senha precisa ter pelo menos 6 caracteres.");
        return;
      }

      if (!acceptedLegal) {
        setError("Para continuar, aceite os termos e a política de privacidade.");
        return;
      }

      setSubmitting(true);

      const direct = await createOrder(service.id);

      if (direct.res.ok && direct.data?.order?.id) {
        router.replace(`/payment?orderId=${direct.data.order.id}`);
        return;
      }

      const register = await registerUser();

      if (!register.res.ok) {
        setError(register.data?.error || "Erro ao criar conta.");
        return;
      }

      const login = await loginUser();

      if (!login.res.ok) {
        setError("Conta criada, mas não foi possível entrar automaticamente.");
        return;
      }

      const order = await createOrder(service.id);

      if (!order.res.ok || !order.data?.order?.id) {
        setError("Erro ao criar pedido.");
        return;
      }

      router.replace(`/payment?orderId=${order.data.order.id}`);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const highlights = normalizeHighlights(service);

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-full border border-white/10 bg-white/10">
          <div className="h-2 w-1/2 rounded-full bg-[var(--accent-green)]" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-black/20 sm:p-8">
            <span className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Etapa 1 de 2 — falta pouco
            </span>

            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Finalize seu atendimento em menos de 2 minutos
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-8 text-white/75">
              Preencha seus dados para iniciarmos a organização do seu
              atendimento. Na próxima etapa, você segue para o pagamento seguro.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold">
                ✔ Sem filas
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold">
                ✔ 100% online
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold">
                ✔ Suporte no processo
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-300/20 bg-blue-300/10 p-4 text-sm leading-6 text-blue-50">
              🔒 Seus dados são usados apenas para execução do atendimento
              contratado.
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm font-semibold text-red-100">
                {error}
              </div>
            ) : null}

            <p className="mt-6 text-xs leading-5 text-white/50">
              A DesenrolaGov é uma assessoria privada e não possui vínculo com
              a Receita Federal, gov.br ou qualquer órgão público.
            </p>
          </section>

          <aside className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-2xl sm:p-8">
            {loading ? (
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Carregando serviço...
                </p>
                <div className="mt-4 h-24 animate-pulse rounded-2xl bg-slate-100" />
                <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : !service ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Nenhum serviço disponível no momento.
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-500">
                  Resumo do atendimento
                </p>

                <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                  {service.name}
                </h2>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {highlights.map((item) => (
                    <p key={item}>✔ {item}</p>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Valor do atendimento
                  </p>
                  <p className="mt-2 text-4xl font-black text-slate-950">
                    {formatCurrency(Number(service.price))}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Pagamento na próxima etapa.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Nome completo
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-green)] focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-green)] focus:ring-4 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Crie uma senha
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-green)] focus:ring-4 focus:ring-green-100"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Essa senha será usada para acompanhar seu pedido.
                    </p>
                  </div>

                  <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                    <input
                      type="checkbox"
                      checked={acceptedLegal}
                      onChange={(e) => setAcceptedLegal(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-green)]"
                    />
                    <span>
                      Li e aceito os termos de uso, política de privacidade e
                      autorizo o uso dos dados para execução do serviço.
                    </span>
                  </label>

                  <button
                    onClick={handleContinue}
                    disabled={!canSubmit}
                    className="w-full rounded-2xl bg-[var(--accent-green)] px-6 py-4 text-base font-black text-white shadow-lg shadow-green-900/20 transition hover:scale-[1.01] hover:bg-[var(--accent-green-hover)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting
                      ? "Processando seu pedido..."
                      : "Continuar para pagamento"}
                  </button>

                  <p className="text-center text-xs text-slate-500">
                    Você será direcionado para o pagamento seguro.
                  </p>

                  <Link
                    href={loginHref}
                    className="block text-center text-sm font-bold text-slate-700 underline underline-offset-4 hover:text-slate-950"
                  >
                    Já tenho conta / acompanhar atendimento
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