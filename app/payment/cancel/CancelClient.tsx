"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CancelClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Pagamento cancelado</h1>

        <p className="text-gray-600">
          Seu pagamento foi cancelado e nenhuma cobrança foi concluída.
        </p>

        {orderId && (
          <div className="rounded-lg border bg-gray-50 p-3 text-sm break-all">
            <strong>Pedido:</strong> {orderId}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={orderId ? `/payment?orderId=${orderId}` : "/orders"}
            className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium"
          >
            Tentar pagamento novamente
          </Link>

          <Link
            href="/orders"
            className="w-full text-center border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg py-2 font-medium"
          >
            Voltar para meus pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}