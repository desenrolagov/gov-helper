import { Suspense } from "react";
import RegisterClient from "./register-client";

export const dynamic = "force-dynamic";

function RegisterPageFallback() {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">

        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Novo acesso
            </div>

            <h1 className="mt-5 text-5xl font-black">
              Criando sua conta...
            </h1>

            <p className="mt-5 text-base text-white/75">
              Estamos preparando seu cadastro para continuar o atendimento.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl sm:p-8">
            <p className="text-sm font-bold text-[var(--accent-green)]">
              DesenrolaGov
            </p>

            <h2 className="mt-1 text-3xl font-black">
              Criar conta
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Carregando formulário...
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterClient />
    </Suspense>
  );
}