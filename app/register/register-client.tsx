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

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      acceptedTerms &&
      acceptedPrivacy &&
      acceptedLgpd &&
      !loading
    );
  }, [
    name,
    email,
    password,
    acceptedTerms,
    acceptedPrivacy,
    acceptedLgpd,
    loading,
  ]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao criar conta.");
        return;
      }

      const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

      if (safeCallbackUrl) {
        router.push(safeCallbackUrl);
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError("Erro inesperado ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        
        {/* LADO ESQUERDO */}
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {continueMode ? "Continuar atendimento" : "Criar conta"}
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
              {continueMode
                ? "Crie sua conta e continue seu atendimento agora"
                : "Crie sua conta para acompanhar seus pedidos"}
            </h1>

            <p className="mt-5 text-base leading-8 text-slate-600">
              {continueMode
                ? "Você está a um passo de concluir. Crie seu acesso e volte direto para continuar o atendimento."
                : "Cadastre-se para acessar sua área do cliente, enviar documentos e acompanhar seu pedido com segurança."}
            </p>

            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Atenção: a DesenrolaGov é uma assessoria privada e não possui vínculo
              com a Receita Federal ou outros órgãos do governo.
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">1</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Cadastro rápido
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Leva menos de 1 minuto.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">2</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Etapa preservada
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Você volta direto ao fluxo.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">3</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Acompanhamento
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tudo organizado na sua conta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-blue-600">DesenrolaGov</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-900">
                Criar conta
              </h2>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Erro no cadastro
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
              />

              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
              />

              <input
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
              />

              {/* CHECKBOXES */}
              <div className="space-y-2 text-sm">
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  Aceito os <Link href="/terms" className="underline">Termos</Link>
                </label>

                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  />
                  Aceito a <Link href="/privacy" className="underline">Privacidade</Link>
                </label>

                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={acceptedLgpd}
                    onChange={(e) => setAcceptedLgpd(e.target.checked)}
                  />
                  Autorizo uso dos dados
                </label>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-slate-900 py-3 text-white"
              >
                {loading
                  ? "Criando conta..."
                  : continueMode
                  ? "Criar conta e continuar"
                  : "Criar conta"}
              </button>
            </form>

            <div className="mt-6 text-sm text-slate-600">
              Já tem conta?{" "}
              <Link href={loginHref} className="font-semibold underline">
                Entrar
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href={homeHref} className="text-sm text-slate-500">
                Voltar
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}