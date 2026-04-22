import { Suspense } from "react";
import Link from "next/link";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

function PaymentPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Etapa de pagamento
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Preparando seu pagamento...
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-600">
              Estamos carregando os dados do seu pedido para liberar o checkout
              com segurança.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  1. Pedido validado
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Conferimos a etapa atual antes do checkout.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  2. Aceite legal
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  O fluxo mantém os registros jurídicos do pedido.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  3. Checkout seguro
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Você será levado para o ambiente protegido de pagamento.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Informações importantes
            </h2>

            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-semibold text-slate-900">
                  Empresa privada
                </div>
                <p className="mt-1">
                  A DesenrolaGov é uma assessoria privada e não possui vínculo
                  com órgãos públicos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-semibold text-slate-900">
                  Pagamento seguro
                </div>
                <p className="mt-1">
                  O pagamento é processado em ambiente protegido.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-semibold text-slate-900">
                  Suporte durante o fluxo
                </div>
                <p className="mt-1">
                  Depois do pagamento, o pedido segue normalmente para as próximas
                  etapas.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-4 text-sm font-semibold">
              <Link href="/terms" className="text-slate-700 underline">
                Termos de Uso
              </Link>
              <Link href="/privacy" className="text-slate-700 underline">
                Privacidade
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