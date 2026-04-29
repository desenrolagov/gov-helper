"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function sanitizeCallbackUrl(callbackUrl: string | null) {
  if (!callbackUrl) return null;
  if (!callbackUrl.startsWith("/")) return null;
  if (callbackUrl.startsWith("//")) return null;
  return callbackUrl;
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = useMemo(() => {
    return sanitizeCallbackUrl(searchParams.get("callbackUrl"));
  }, [searchParams]);

  const continueMode = useMemo(() => {
    if (!callbackUrl) return false;
    return (
      callbackUrl.startsWith("/continue") ||
      callbackUrl.startsWith("/payment") ||
      callbackUrl.startsWith("/orders")
    );
  }, [callbackUrl]);

  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  const homeHref = callbackUrl || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedLgpd, setAcceptedLgpd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    acceptedTerms &&
    acceptedPrivacy &&
    acceptedLgpd &&
    !loading;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) {
      setError(
        "Preencha seus dados e aceite os Termos, Privacidade e LGPD para continuar."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          termsAccepted: acceptedTerms,
          privacyAccepted: acceptedPrivacy,
          lgpdAccepted: acceptedLgpd,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao criar conta.");
        return;
      }

      const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

      router.push(safeCallbackUrl || "/dashboard");
      router.refresh();
    } catch {
      setError("Erro inesperado ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-black text-green-300">
              {continueMode ? "Continuar atendimento" : "Área do cliente"}
            </div>

            <h1 className="mt-5 text-5xl font-black leading-tight">
              {continueMode
                ? "Crie sua conta e continue seu atendimento"
                : "Crie sua conta para acompanhar seus pedidos"}
            </h1>

            <p className="mt-5 text-base text-white/75">
              Cadastro rápido e seguro para acompanhar pedidos, enviar dados e
              acessar as próximas etapas do atendimento.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="font-black">✅ Acompanhamento online</p>
                <p className="mt-1 text-sm text-white/70">
                  Veja o andamento dos seus pedidos em um só lugar.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="font-black">🔒 Dados protegidos</p>
                <p className="mt-1 text-sm text-white/70">
                  Cadastro com aceite de Termos, Privacidade e LGPD.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
              A DesenrolaGov é uma assessoria privada e não possui vínculo com
              órgãos públicos.
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Novo cadastro
            </p>

            <h2 className="mt-2 text-3xl font-black">Criar conta</h2>

            <p className="mt-2 text-sm text-slate-600">
              Preencha os dados abaixo para acessar sua área do cliente.
            </p>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <input
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:bg-white"
              />

              <input
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:bg-white"
              />

              <input
                type="password"
                placeholder="Senha com no mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-600 focus:bg-white"
              />

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Li e aceito os{" "}
                    <Link href="/terms" className="font-black underline">
                      Termos de Uso
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Li e aceito a{" "}
                    <Link href="/privacy" className="font-black underline">
                      Política de Privacidade
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={acceptedLgpd}
                    onChange={(e) => setAcceptedLgpd(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Autorizo o tratamento dos meus dados para cadastro,
                    comunicação e execução do serviço.
                  </span>
                </label>
              </div>

              <button
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-[var(--accent-green)] py-4 font-black text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? "Criando conta..." : "Criar conta e continuar"}
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-3 text-center text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link href={loginHref} className="font-black text-slate-900 underline">
                Já tenho conta
              </Link>

              <Link href={homeHref} className="font-bold text-slate-500 underline">
                Voltar
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}