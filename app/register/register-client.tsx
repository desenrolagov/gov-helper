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
    name.trim() &&
    email.trim() &&
    password.length >= 6 &&
    acceptedTerms &&
    acceptedPrivacy &&
    acceptedLgpd &&
    !loading;

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
    } catch {
      setError("Erro inesperado ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">

        {/* ESQUERDA */}
        <section className="hidden lg:block">
          <div className="max-w-xl">

            <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              {continueMode ? "Continuar atendimento" : "Criar conta"}
            </div>

            <h1 className="mt-5 text-5xl font-black">
              {continueMode
                ? "Crie sua conta e continue agora"
                : "Crie sua conta para acompanhar seus pedidos"}
            </h1>

            <p className="mt-5 text-base text-white/75">
              Cadastro rápido, seguro e com acesso completo ao seu atendimento.
            </p>

            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              A DesenrolaGov é uma assessoria privada sem vínculo com órgãos públicos.
            </div>

          </div>
        </section>

        {/* FORM */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white p-6 text-black shadow-xl">

            <h2 className="text-2xl font-black">Criar conta</h2>

            {error && (
              <div className="mt-4 rounded-xl bg-red-100 p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">

              <input
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              />

              <input
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              />

              <input
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              />

              <div className="text-sm space-y-1">
                <label className="flex gap-2">
                  <input type="checkbox" onChange={(e)=>setAcceptedTerms(e.target.checked)} />
                  Termos
                </label>

                <label className="flex gap-2">
                  <input type="checkbox" onChange={(e)=>setAcceptedPrivacy(e.target.checked)} />
                  Privacidade
                </label>

                <label className="flex gap-2">
                  <input type="checkbox" onChange={(e)=>setAcceptedLgpd(e.target.checked)} />
                  LGPD
                </label>
              </div>

              <button
                disabled={!canSubmit}
                className="w-full bg-[var(--accent-green)] text-white py-3 rounded-xl font-bold"
              >
                {loading ? "Criando..." : "Criar conta"}
              </button>

            </form>

            <div className="mt-4 text-sm">
              Já tem conta?{" "}
              <Link href={loginHref} className="underline font-bold">
                Entrar
              </Link>
            </div>

            <div className="mt-3 text-sm text-center">
              <Link href={homeHref}>Voltar</Link>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}