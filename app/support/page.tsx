import Link from "next/link";

import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SupportAssistant from "@/components/support/SupportAssistant";
import { type SupportStage, getSupportStageLabel } from "@/lib/support";

export const dynamic = "force-dynamic";

function mapOrderStatusToSupportStage(status?: string | null): SupportStage {
  switch (status) {
    case "PENDING_PAYMENT":
      return "PENDING_PAYMENT";
    case "PAID":
      return "PAID";
    case "AWAITING_DOCUMENTS":
      return "AWAITING_DOCUMENTS";
    case "PROCESSING":
      return "PROCESSING";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "GENERAL";
  }
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return "Pagamento aprovado";
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos";
    case "PROCESSING":
      return "Em andamento";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Em análise";
  }
}

function getStageMessage(stage: SupportStage) {
  switch (stage) {
    case "PENDING_PAYMENT":
      return "Seu pedido foi criado, mas ainda depende da confirmação do pagamento.";
    case "PAID":
      return "Pagamento confirmado. Agora envie os documentos.";
    case "AWAITING_DOCUMENTS":
      return "Estamos aguardando seus documentos.";
    case "PROCESSING":
      return "Seu pedido está sendo analisado.";
    case "COMPLETED":
      return "Seu pedido foi concluído.";
    case "CANCELLED":
      return "Pedido cancelado.";
    default:
      return "Use o suporte para dúvidas ou acompanhamento.";
  }
}

function buildWhatsAppHref(text: string) {
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/5517991762888?text=${encodedText}`;
}

export default async function SupportPage() {
  const session = await verifySession();

  let stage: SupportStage = "GENERAL";

  let latestOrder: any = null;

  if (session?.userId) {
    const order = await prisma.order.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderCode: true,
        status: true,
        createdAt: true,
        service: { select: { name: true } },
      },
    });

    if (order) {
      latestOrder = order;
      stage = mapOrderStatusToSupportStage(order.status);
    }
  }

  const whatsappMessage = latestOrder
    ? `Olá! Preciso de ajuda com meu pedido ${
        latestOrder.orderCode || latestOrder.id.slice(0, 8)
      }`
    : "Olá! Preciso de ajuda com meu atendimento.";

  const whatsappHref = buildWhatsAppHref(whatsappMessage);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* TOPO */}
        <section className="bg-white p-6 rounded-3xl border shadow-sm">
          <h1 className="text-2xl font-bold">Central de Suporte</h1>
          <p className="text-sm text-slate-600 mt-2">
            Acompanhe seu pedido ou fale diretamente conosco.
          </p>

          <div className="mt-4 flex gap-3 flex-col sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              className="bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold text-center"
            >
              Falar no WhatsApp
            </a>

            {latestOrder && (
              <Link
                href={`/orders/${latestOrder.id}`}
                className="border px-5 py-3 rounded-xl text-sm text-center"
              >
                Ver meu pedido
              </Link>
            )}
          </div>
        </section>

        {/* STATUS */}
        <section className="bg-white p-6 rounded-3xl border shadow-sm">
          <h2 className="font-semibold text-lg">Situação atual</h2>
          <p className="text-xl font-bold mt-2">
            {getSupportStageLabel(stage)}
          </p>
          <p className="text-sm text-slate-600 mt-2">
            {getStageMessage(stage)}
          </p>
        </section>

        {/* ASSISTENTE */}
        <SupportAssistant stage={stage} />

        {/* FAQ */}
        <section className="bg-white p-6 rounded-3xl border shadow-sm">
          <h2 className="font-semibold text-lg">Dúvidas frequentes</h2>

          <div className="mt-4 space-y-3">
            <details className="border p-3 rounded-xl">
              <summary>Quanto tempo demora?</summary>
              <p className="text-sm mt-2">
                Depende da análise do caso. Você será atualizado.
              </p>
            </details>

            <details className="border p-3 rounded-xl">
              <summary>Preciso enviar documentos?</summary>
              <p className="text-sm mt-2">
                Sim, após o pagamento aprovado.
              </p>
            </details>

            <details className="border p-3 rounded-xl">
              <summary>É seguro?</summary>
              <p className="text-sm mt-2">
                Seus dados são usados apenas para execução do serviço.
              </p>
            </details>
          </div>
        </section>

      </div>
    </main>
  );
}