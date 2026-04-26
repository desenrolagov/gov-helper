import { Suspense } from "react";
import ContinueClient from "./continue-client";

export const dynamic = "force-dynamic";

function ContinuePageFallback() {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
            <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Continuação do atendimento
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Carregando etapa de continuação...
            </h1>

            <p className="mt-3 text-base leading-7 text-white/75">
              Estamos preparando os dados do serviço para você seguir ao
              pagamento.
            </p>
          </section>

          <aside className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl sm:p-8">
            <div className="text-sm font-bold text-slate-500">
              Resumo do serviço
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Carregando serviço...
            </div>

            <div className="mt-6 h-12 animate-pulse rounded-2xl bg-[var(--accent-green)]/20" />
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