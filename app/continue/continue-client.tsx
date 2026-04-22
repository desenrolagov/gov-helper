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
      "Acompanhamento do processo",
      "Suporte durante todo o fluxo",
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
          setError("Nenhum serviço disponível.");
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
        setError("Senha mínima de 6 caracteres.");
        return;
      }

      if (!acceptedLegal) {
        setError("Aceite os termos para continuar.");
        return;
      }

      setSubmitting(true);

      const direct = await createOrder(service.id);

      if (direct.res.ok && direct.data?.order?.id) {
        router.replace(`/payment?orderId=${direct.data.order.id}`);
        return;
      }

      if (direct.res.status !== 401) {
        setError(direct.data?.error || "Erro ao continuar.");
        return;
      }

      const register = await registerUser();

      if (!register.res.ok) {
        setError(register.data?.error || "Não foi possível criar sua conta.");
        return;
      }

      const login = await loginUser();

      if (!login.res.ok) {
        setError(login.data?.error || "Conta criada, mas o login falhou.");
        return;
      }

      const order = await createOrder(service.id);

      if (!order.res.ok || !order.data?.order?.id) {
        setError(order.data?.error || "Erro ao criar pedido.");
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
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-black leading-tight">
              Finalize seu cadastro
            </h1>

            <ul className="mt-4 max-w-md space-y-2 text-sm leading-7 text-slate-600">
              <li>• Cadastro rápido</li>
              <li>• Pagamento na próxima etapa</li>
              <li>• Envio de documentos depois</li>
            </ul>

            <div className="mt-4 max-w-md rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              Assessoria privada, sem vínculo com órgãos públicos.
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </section>

          <aside className="rounded-3xl border-2 border-slate-900 bg-white p-6">
            {loading ? (
              <div>Carregando...</div>
            ) : !service ? (
              <div>Sem serviço.</div>
            ) : (
              <>
                <h2 className="text-xl font-black">{service.name}</h2>

                <ul className="mt-3 max-w-md space-y-2 text-sm leading-6 text-slate-600">
                  {highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>

                <div className="mt-4 text-4xl font-black">
                  {formatCurrency(service.price)}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nome
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="voce@email.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                      placeholder="Mínimo de 6 caracteres"
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={acceptedLegal}
                      onChange={(e) => setAcceptedLegal(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Aceito os{" "}
                      <Link href="/terms" className="font-semibold underline">
                        Termos de Uso
                      </Link>{" "}
                      e a{" "}
                      <Link href="/privacy" className="font-semibold underline">
                        Política de Privacidade
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!canSubmit}
                    className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Carregando..." : "Continuar para pagamento"}
                  </button>

                  <Link
                    href={loginHref}
                    className="block text-center text-sm font-medium text-slate-600 underline"
                  >
                    Já tenho conta
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