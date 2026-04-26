import { Suspense } from "react";
import Link from "next/link";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

function PaymentPageFallback() {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
            <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Etapa de pagamento
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Preparando seu pagamento...
            </h1>

            <p className="mt-3 text-base leading-7 text-white/75">
              Estamos carregando os dados do seu pedido para liberar o checkout
              com segurança.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                "Pedido validado",
                "Aceite legal",
                "Checkout seguro",
              ].map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <div className="text-sm font-bold text-white">
                    {index + 1}. {item}
                  </div>
                  <p className="mt-1 text-sm text-white/65">
                    Etapa protegida para continuar seu atendimento.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl sm:p-8">
            <h2 className="text-xl font-black">Informações importantes</h2>

            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">Empresa privada</div>
                <p className="mt-1">
                  A DesenrolaGov é uma assessoria privada e não possui vínculo
                  com órgãos públicos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">
                  Pagamento seguro
                </div>
                <p className="mt-1">
                  O pagamento é processado em ambiente protegido.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">
                  Próxima etapa
                </div>
                <p className="mt-1">
                  Após o pagamento, você seguirá para o envio dos documentos.
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