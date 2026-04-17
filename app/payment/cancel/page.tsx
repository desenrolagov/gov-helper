import { Suspense } from "react";
import CancelClient from "./CancelClient";

export const dynamic = "force-dynamic";

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-red-50 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="mb-4 text-5xl">⏳</div>
            <h1 className="text-2xl font-bold text-red-700 mb-2">
              Carregando...
            </h1>
            <p className="text-gray-600">
              Aguarde enquanto carregamos as informações do pagamento.
            </p>
          </div>
        </main>
      }
    >
      <CancelClient />
    </Suspense>
  );
}