"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function UploadDocumentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-[var(--text-dark)] shadow-xl">

        <h1 className="text-2xl font-black">
          Envio de documentos
        </h1>

        <p className="mt-4 text-sm text-slate-600">
          Esta rota não é mais o fluxo principal. Para evitar erros,
          utilize a tela correta do pedido.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

          {orderId && (
            <Link
              href={`/orders/${orderId}/upload`}
              className="flex items-center justify-center rounded-2xl bg-[var(--accent-green)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
            >
              Ir para o upload do pedido
            </Link>
          )}

          <Link
            href="/orders"
            className="flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
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
        <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-10 text-white">
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-slate-600 shadow-xl">
            Carregando...
          </div>
        </main>
      }
    >
      <UploadDocumentContent />
    </Suspense>
  );
}