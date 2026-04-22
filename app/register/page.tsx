import { Suspense } from "react";
import RegisterClient from "./register-client";

export const dynamic = "force-dynamic";

function RegisterPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Novo acesso
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
              Carregando cadastro...
            </h1>

            <p className="mt-5 text-base leading-8 text-slate-600">
              Estamos preparando sua etapa de cadastro.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-blue-600">DesenrolaGov</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Criar conta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Carregando formulário...
              </p>
            </div>
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