"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ContinuePage() {
  const router = useRouter();
  const params = useSearchParams();
  const serviceId = params.get("serviceId");

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
      !!serviceId &&
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      acceptedTerms &&
      acceptedPrivacy &&
      acceptedLgpd &&
      !loading
    );
  }, [
    serviceId,
    name,
    email,
    password,
    acceptedTerms,
    acceptedPrivacy,
    acceptedLgpd,
    loading,
  ]);

  async function handleContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!serviceId) {
      setError("Serviço não identificado. Volte e escolha o serviço novamente.");
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

    if (!acceptedTerms || !acceptedPrivacy || !acceptedLgpd) {
      setError("Você precisa aceitar os termos, a política e o tratamento de dados.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register-and-continue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          serviceId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao continuar atendimento.");
        return;
      }

      if (data?.orderId) {
        router.push(`/payment?orderId=${data.orderId}`);
        return;
      }

      setError("Não foi possível gerar o pedido para continuar.");
    } catch (error) {
      console.error("Erro ao continuar atendimento:", error);
      setError("Erro inesperado ao continuar atendimento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Continuar atendimento
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Você está a um passo de iniciar seu atendimento
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Crie seu acesso rapidamente para acompanhar o pedido, enviar documentos
            e visualizar o resultado final com segurança.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                1. Cadastro rápido
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Leva menos de 1 minuto para concluir.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                2. Pagamento seguro
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Seu pedido segue direto para a etapa de pagamento.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                3. Acompanhamento
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Depois você acompanha tudo na sua área do cliente.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm text-slate-600">
            Cadastre-se para acessar a área do cliente e continuar seu fluxo com
            mais praticidade.
          </p>

          <form onSubmit={handleContinue} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                Nome
              </label>
              <input
                type="text"
                placeholder="Digite seu nome"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                E-mail
              </label>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                Senha
              </label>
              <input
                type="password"
                placeholder="Crie uma senha"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use pelo menos 6 caracteres.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>
                  Li e aceito os{" "}
                  <Link href="/terms" target="_blank" className="font-semibold underline">
                    Termos de Uso
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                />
                <span>
                  Li e aceito a{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-semibold underline"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedLgpd}
                  onChange={(e) => setAcceptedLgpd(e.target.checked)}
                />
                <span>
                  Autorizo o tratamento dos meus dados pessoais para cadastro,
                  execução do serviço contratado, comunicação e cumprimento das
                  obrigações legais aplicáveis.
                </span>
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Continuando..." : "Continuar atendimento"}
            </button>

            <p className="text-xs leading-5 text-slate-500">
              Ao continuar, você cria sua conta e segue diretamente para o pagamento
              do serviço selecionado.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}