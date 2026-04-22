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

export default function LoginPage() {
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

  const registerHref = callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/register";

  const homeHref = callbackUrl || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao fazer login.");
        return;
      }

      const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);

      if (safeCallbackUrl) {
        router.push(safeCallbackUrl);
      } else if (data?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Erro inesperado ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {continueMode ? "Continuar atendimento" : "Área de acesso"}
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
              {continueMode
                ? "Entre para continuar seu atendimento sem perder a etapa atual"
                : "Entre para acompanhar seus pedidos com mais clareza"}
            </h1>

            <p className="mt-5 text-base leading-8 text-slate-600">
              {continueMode
                ? "Faça login para voltar direto ao fluxo do seu atendimento e seguir para a próxima etapa com rapidez."
                : "Acesse sua conta para visualizar pedidos, enviar documentos, acompanhar o andamento do atendimento e seguir cada etapa em um só lugar."}
            </p>

            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Atenção: a DesenrolaGov é uma assessoria privada e não possui vínculo
              com a Receita Federal ou outros órgãos do governo.
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">1</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Login rápido
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Entre com segurança para continuar seu fluxo.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">2</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Etapa preservada
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Você volta para o ponto certo do atendimento.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-900">3</p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  Acompanhamento organizado
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Pedidos, documentos e andamento em um só lugar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-blue-600">DesenrolaGov</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Entrar
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {continueMode
                  ? "Faça login para continuar seu atendimento agora."
                  : "Acesse sua conta para continuar seu atendimento com segurança."}
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Não foi possível entrar
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Entrando..."
                  : continueMode
                  ? "Entrar e continuar"
                  : "Entrar na conta"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Ainda não tem conta?{" "}
                <Link
                  href={registerHref}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                href={homeHref}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                {continueMode ? "Voltar para o atendimento" : "Voltar para a página inicial"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}