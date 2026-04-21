import { Suspense } from "react";
import ContinueClient from "./ContinueClient";

export const dynamic = "force-dynamic";

function ContinuePageFallback() {
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
            Carregando etapa de continuação...
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </section>
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