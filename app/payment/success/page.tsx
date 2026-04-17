import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PaymentSuccessPageProps = {
  searchParams?: Promise<{
    orderId?: string;
  }>;
};

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = (await searchParams) ?? {};
  const orderId = params.orderId?.trim();

  if (!orderId) {
    redirect("/orders");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
        },
      },
    },
  });

  if (!order) {
    redirect("/orders");
  }

  const latestPayment = order.payments[0];
  const latestPaymentStatus = latestPayment?.status ?? null;

  const hasConfirmedPayment =
    latestPaymentStatus === "PAID" ||
    order.status === "PAID" ||
    order.status === "AWAITING_DOCUMENTS" ||
    order.status === "PROCESSING" ||
    order.status === "COMPLETED";

  if (hasConfirmedPayment) {
    redirect(`/orders/${order.id}/upload`);
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-5xl">⏳</div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Confirmando pagamento
        </h1>

        <p className="mb-3 text-slate-600">
          Recebemos o retorno do checkout e estamos aguardando a confirmação
          final do pagamento.
        </p>

        <p className="mb-6 text-sm text-slate-500">
          Isso normalmente leva apenas alguns instantes. Atualize a página em
          alguns segundos.
        </p>

        <div className="space-y-3">
          <a
            href={`/payment?orderId=${order.id}`}
            className="block w-full rounded-lg bg-slate-900 py-2 font-medium text-white hover:bg-slate-800"
          >
            Voltar para a tela de pagamento
          </a>

          <a
            href={`/orders/${order.id}`}
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Abrir pedido
          </a>
        </div>
      </div>
    </main>
  );
}