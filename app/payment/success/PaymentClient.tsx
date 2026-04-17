"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    try {
      setError("");

      if (!orderId) {
        setError("Pedido não informado.");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao iniciar pagamento.");
        return;
      }

      if (!data.url) {
        setError("URL de checkout não recebida.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      setError("Erro inesperado ao iniciar pagamento.");
    } finally {
      setLoading(false);
    }
  }

  function goToUpload() {
    if (!orderId) {
      setError("Pedido não informado.");
      return;
    }

    router.push(`/orders/${orderId}/upload`);
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  if (!orderId) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-2">Pagamento do pedido</h1>

          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            Pedido não informado.
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-4 w-full border rounded-lg py-2 font-medium hover:bg-gray-50"
          >
            Voltar ao dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-2">Pagamento do pedido</h1>

        <p className="text-sm text-gray-600 mb-6">
          Finalize o pagamento para continuar o atendimento.
        </p>

        <div className="mb-4 rounded-lg border bg-gray-50 p-3 text-sm break-all">
          <strong>Pedido:</strong> {orderId}
        </div>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Fluxo: envio de documentos → pagamento → confirmação automática.
        </div>

        {/* ✅ BLOCO JURÍDICO DISCRETO */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Você está aceitando os termos atuais da plataforma para este pedido.
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 font-medium disabled:opacity-50"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Redirecionando..." : "Pagar agora"}
          </button>

          <button
            type="button"
            className="w-full border rounded-lg py-2 font-medium hover:bg-gray-50"
            onClick={goToUpload}
            disabled={loading}
          >
            Voltar para envio de documentos
          </button>

          <button
            type="button"
            className="w-full border rounded-lg py-2 font-medium hover:bg-gray-50"
            onClick={goToDashboard}
            disabled={loading}
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    </main>
  );
}