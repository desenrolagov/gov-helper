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
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    termsAccepted &&
    privacyAccepted &&
    lgpdAccepted;

  async function handleRegister(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Preencha nome, e-mail e senha.");
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
          termsAccepted,
          privacyAccepted,
          lgpdAccepted,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Não foi possível criar sua conta.");
        return;
      }

      setSuccess("Conta criada com sucesso. Redirecionando para o login...");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError("Erro inesperado ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-black text-green-300">
            Área do cliente
          </div>

          <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
            Crie sua conta para acompanhar seus pedidos
          </h1>

          <p className="mt-4 max-w-xl text-base text-white/80">
            Tenha acesso seguro para acompanhar seu atendimento, enviar dados e
            visualizar as próximas etapas.
          </p>

          <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-black">✅ Cadastro rápido</p>
              <p className="mt-1 text-xs text-white/70">Leva menos de 1 minuto.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-black">🔒 Dados protegidos</p>
              <p className="mt-1 text-xs text-white/70">Tratamento conforme LGPD.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-black">📲 Acompanhamento</p>
              <p className="mt-1 text-xs text-white/70">Pedidos em um só lugar.</p>
            </div>
          </div>

          <div className="mt-6 max-w-xl rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
            A DesenrolaGov é uma assessoria privada e não possui vínculo com
            órgãos públicos.
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Novo acesso
          </p>

          <h2 className="mt-2 text-3xl font-black">Criar conta</h2>

          <p className="mt-2 text-sm text-slate-600">
            Preencha seus dados para acessar sua área do cliente.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Nome completo
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                E-mail
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@email.com"
                type="email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Senha
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                type="password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
              />
              <p className="mt-1 text-xs text-slate-500">
                Use pelo menos 6 caracteres.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
              <label className="flex gap-3">
                <input
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Li e aceito os{" "}
                  <Link href="/terms" className="font-bold underline">
                    Termos de Uso
                  </Link>
                  .
                </span>
              </label>

              <label className="flex gap-3">
                <input
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Li e aceito a{" "}
                  <Link href="/privacy" className="font-bold underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>

              <label className="flex gap-3">
                <input
                  checked={lgpdAccepted}
                  onChange={(e) => setLgpdAccepted(e.target.checked)}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                />
                <span>
                  Autorizo o tratamento dos meus dados pessoais para cadastro,
                  execução do serviço, comunicação e cumprimento de obrigações
                  legais.
                </span>
              </label>

              <p className="text-xs text-slate-500">
                Versão legal vigente: {legalVersion}
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-black text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <div className="flex flex-col gap-3 text-center text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link href="/login" className="font-bold text-slate-900 underline">
                Já tenho conta
              </Link>

              <Link href="/" className="font-bold text-slate-500 underline">
                Voltar ao início
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}