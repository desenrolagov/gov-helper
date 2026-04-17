"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getLegalVersionLabel } from "@/lib/legal";

export default function RegisterPage() {
  const router = useRouter();

  const legalVersion = useMemo(() => getLegalVersionLabel(), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit =
    !loading &&
    !!name.trim() &&
    !!email.trim() &&
    !!password &&
    password.length >= 6 &&
    termsAccepted &&
    privacyAccepted &&
    lgpdAccepted;

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Preencha nome, email e senha.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!termsAccepted || !privacyAccepted || !lgpdAccepted) {
      setError(
        "Você precisa aceitar os Termos de Uso, a Política de Privacidade e o consentimento LGPD."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          lgpdAccepted,
          termsAccepted,
          privacyAccepted,
          legalAcceptedVersion: legalVersion,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao cadastrar usuário.");
        return;
      }

      setSuccess(
        "Cadastro realizado com sucesso. Redirecionando para o login..."
      );
      setName("");
      setEmail("");
      setPassword("");
      setTermsAccepted(false);
      setPrivacyAccepted(false);
      setLgpdAccepted(false);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError("Erro inesperado ao cadastrar.");
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
              Novo acesso
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
              Crie sua conta para iniciar seu atendimento com mais organização
            </h1>

            <p className="mt-5 text-base leading-8 text-slate-600">
              Tenha acesso à sua área do cliente para solicitar serviços, enviar
              documentos, acompanhar pedidos e visualizar cada etapa do processo
              com mais clareza.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-blue-600">GOV Helper</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Criar conta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cadastre-se para acessar a área do cliente e continuar o seu
                fluxo com mais praticidade.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Não foi possível concluir o cadastro
                </p>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Cadastro concluído
                </p>
                <p className="mt-1 text-sm text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
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
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Use pelo menos 6 caracteres.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
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
                    </Link>
                    .
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm leading-6 text-slate-700">
                    Li e aceito a{" "}
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

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={lgpdAccepted}
                    onChange={(e) => setLgpdAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm leading-6 text-slate-700">
                    Autorizo o tratamento dos meus dados pessoais para cadastro,
                    execução do serviço contratado, comunicação e cumprimento das
                    obrigações legais aplicáveis.
                  </span>
                </label>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs text-slate-500">
                    Versão legal vigente:{" "}
                    <span className="font-semibold text-slate-700">
                      {legalVersion}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Cadastrando..." : "Criar minha conta"}
              </button>

              {!termsAccepted || !privacyAccepted || !lgpdAccepted ? (
                <p className="text-xs text-slate-500">
                  Para continuar, aceite os Termos de Uso, a Política de
                  Privacidade e o consentimento LGPD.
                </p>
              ) : null}
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Já tem conta?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Entrar agora
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Voltar para a página inicial
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}