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

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      !submitting &&
      !!service?.id &&
      !!name.trim() &&
      !!email.trim() &&
      password.length >= 6 &&
      acceptedLegal
    );
  }, [loading, submitting, service?.id, name, email, password, acceptedLegal]);

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

  async function handleContinue() {
    try {
      setError("");

      if (!service?.id) {
        setError("Serviço não encontrado.");
        return;
      }

      if (!name.trim() || !email.trim() || !password) {
        setError("Preencha nome, e-mail e senha.");
        return;
      }

      if (password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }

      if (!acceptedLegal) {
        setError(
          "Para continuar, aceite os Termos de Uso e a Política de Privacidade."
        );
        return;
      }

      setSubmitting(true);

      // 1) Tenta criar pedido direto primeiro.
      // Se o usuário já estiver logado, segue sem cadastro.
      const directOrderAttempt = await createOrder(service.id);

      if (directOrderAttempt.res.ok) {
        const orderId = directOrderAttempt.data?.order?.id;

        if (!orderId) {
          setError("Pedido criado, mas o identificador não foi retornado.");
          return;
        }

        router.replace(`/payment?orderId=${orderId}`);
        router.refresh();
        return;
      }

      // 2) Se não estiver autenticado, cria conta
      if (directOrderAttempt.res.status === 401) {
        const registerRes = await fetch("/api/register", {
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

        const registerData = await registerRes.json().catch(() => null);

        if (!registerRes.ok) {
          setError(registerData?.error || "Não foi possível criar sua conta.");
          return;
        }

        // 3) Faz login automático
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        });

        const loginData = await loginRes.json().catch(() => null);

        if (!loginRes.ok) {
          setError(
            loginData?.error ||
              "Conta criada, mas não foi possível iniciar sua sessão automaticamente."
          );
          return;
        }

        // 4) Cria o pedido já autenticado
        const orderAttempt = await createOrder(service.id);

        if (!orderAttempt.res.ok) {
          setError(orderAttempt.data?.error || "Não foi possível continuar.");
          return;
        }

        const orderId = orderAttempt.data?.order?.id;

        if (!orderId) {
          setError("Pedido criado, mas o identificador não foi retornado.");
          return;
        }

        router.replace(`/payment?orderId=${orderId}`);
        router.refresh();
        return;
      }

      if (directOrderAttempt.res.status === 403) {
        setError(
          directOrderAttempt.data?.error ||
            "Sua conta atual não pode iniciar esse atendimento."
        );
        return;
      }

      setError(directOrderAttempt.data?.error || "Não foi possível continuar.");
    } catch (err) {
      console.error("Erro ao continuar o atendimento:", err);
      setError("Erro inesperado ao continuar o atendimento.");
    } finally {
      setSubmitting(false);
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
              Faça seu cadastro rápido e siga ao pagamento
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Para quem está chegando agora, o caminho mais rápido é criar o
              acesso nesta etapa e seguir direto para o pagamento, sem perder o
              fluxo.
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
                  1. Cadastro rápido
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Você cria seu acesso em menos de 1 minuto.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  2. Pagamento
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  O checkout é aberto logo após a criação da conta.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  3. Envio de documentos
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

                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Nome
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Crie uma senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Use pelo menos 6 caracteres.
                    </p>
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
                  disabled={!canSubmit}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Continuando..." : "Criar conta e ir para pagamento"}
                </button>

                <div className="mt-4 text-center text-xs text-slate-500">
                  Ao continuar, sua conta é criada, o pedido é aberto e o fluxo
                  segue para o checkout.
                </div>

                <div className="mt-6">
                  <Link
                    href={loginHref}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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