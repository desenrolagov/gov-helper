import { Suspense } from "react";
import Link from "next/link";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

function PaymentPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Etapa de pagamento
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Carregando pagamento...
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Aguarde enquanto preparamos as informações do seu pedido e a etapa
              de confirmação para seguir com segurança.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  1. Revisão
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Conferimos os dados do pedido antes de abrir o checkout.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  2. Aceite legal
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Confirmamos termos e privacidade antes do pagamento.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  3. Checkout
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  O pagamento é liberado somente após a validação da etapa.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Antes de continuar
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Proteção jurídica
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  O pagamento é vinculado ao aceite dos termos e da política de
                  privacidade.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Segurança do fluxo
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Isso evita inconsistências no atendimento, no pagamento e na
                  execução do serviço.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-700 underline"
              >
                Termos de Uso
              </Link>

              <Link
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-slate-700 underline"
              >
                Política de Privacidade
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentPageFallback />}>
      <PaymentClient />
    </Suspense>
  );
}