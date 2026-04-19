import { Suspense } from "react";
import Link from "next/link";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

function PaymentPageFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* BLOCO PRINCIPAL */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Etapa de pagamento
            </div>

            <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
              Preparando seu pagamento...
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Estamos carregando as informações do seu pedido de{" "}
              <span className="font-semibold text-slate-900">
                regularização de CPF
              </span>{" "}
              para você seguir com segurança.
            </p>

            {/* ETAPAS */}
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  1. Revisão do pedido
                </p>
                <p className="text-xs text-slate-500">
                  Conferimos seus dados antes de liberar o pagamento.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  2. Aceite legal
                </p>
                <p className="text-xs text-slate-500">
                  Garantimos transparência e proteção jurídica.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  3. Pagamento seguro
                </p>
                <p className="text-xs text-slate-500">
                  Você será redirecionado para um ambiente protegido.
                </p>
              </div>
            </div>
          </section>

          {/* LATERAL */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Informações importantes
            </h2>

            <div className="mt-4 space-y-3">

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Empresa privada
                </p>
                <p className="text-xs text-slate-600">
                  A DesenrolaGov é uma assessoria privada e não possui vínculo com órgãos públicos.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Pagamento seguro
                </p>
                <p className="text-xs text-slate-600">
                  Processado por plataforma certificada com criptografia.
                </p>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Suporte garantido
                </p>
                <p className="text-xs text-slate-600">
                  Atendimento durante todo o processo do seu pedido.
                </p>
              </div>

            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link href="/terms" target="_blank" className="underline">
                Termos de Uso
              </Link>
              <Link href="/privacy" target="_blank" className="underline">
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