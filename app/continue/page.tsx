import { Suspense } from "react";
import ContinueClient from "./continue-client";

export const dynamic = "force-dynamic";

function ContinuePageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Continuação do atendimento
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Carregando etapa de continuação...
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Estamos preparando os dados do serviço para você seguir ao pagamento.
            </p>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="text-sm font-semibold text-slate-500">
              Resumo do serviço
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Carregando serviço...
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ContinuePage() {
  return (
    <Suspense fallback={<ContinuePageFallback />}>
      <ContinueClient />
    </Suspense>
  );
}