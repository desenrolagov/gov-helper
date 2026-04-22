"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function UploadDocumentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-black text-slate-900">
          Envio de documentos
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Esta rota não é mais o fluxo principal de envio. Para evitar erros,
          o envio deve ser feito pela tela correta do pedido.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {orderId ? (
            <Link
              href={`/orders/${orderId}/upload`}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Ir para o upload do pedido
            </Link>
          ) : null}

          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Ver meus pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function UploadDocumentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-10">
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Carregando...</p>
          </div>
        </main>
      }
    >
      <UploadDocumentContent />
    </Suspense>
  );
}