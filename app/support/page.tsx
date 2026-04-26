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

function getStageMessage(stage: SupportStage) {
  switch (stage) {
    case "PENDING_PAYMENT":
      return "Seu pedido foi criado, mas ainda depende da confirmação do pagamento.";
    case "PAID":
      return "Pagamento confirmado. Agora envie os documentos para continuar.";
    case "AWAITING_DOCUMENTS":
      return "Estamos aguardando seus documentos obrigatórios.";
    case "PROCESSING":
      return "Seu pedido está em análise pela equipe.";
    case "COMPLETED":
      return "Seu pedido foi concluído. Consulte seus documentos finais.";
    case "CANCELLED":
      return "Este pedido foi cancelado.";
    default:
      return "Use o suporte para tirar dúvidas, entender etapas ou acompanhar seu atendimento.";
  }
}

function buildWhatsAppHref(text: string) {
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/5517991762888?text=${encodedText}`;
}

export default async function SupportPage() {
  const session = await verifySession();

  let stage: SupportStage = "GENERAL";
  let latestOrder: {
    id: string;
    orderCode: string | null;
    status: string;
    service: { name: string };
  } | null = null;

  if (session?.userId) {
    const order = await prisma.order.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderCode: true,
        status: true,
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
    : "Olá! Preciso de ajuda com meu atendimento na DesenrolaGov.";

  const whatsappHref = buildWhatsAppHref(whatsappMessage);

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
          <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
            Central de suporte
          </div>

          <h1 className="mt-4 text-3xl font-black sm:text-5xl">
            Precisa de ajuda?
          </h1>

          <p className="mt-4 max-w-3xl text-sm text-white/70">
            Tire dúvidas sobre pagamento, envio de documentos, status do pedido
            ou fale com nossa equipe.
          </p>

          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
            A DesenrolaGov é uma assessoria privada e não possui vínculo com órgãos públicos.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent-green)] px-6 py-3 text-sm font-bold text-white"
            >
              Falar no WhatsApp
            </a>

            {latestOrder ? (
              <Link
                href={`/orders/${latestOrder.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white"
              >
                Ver meu pedido
              </Link>
            ) : (
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white"
              >
                Ver serviços
              </Link>
            )}
          </div>
        </section>

        {/* STATUS */}
        <section className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
          <p className="text-sm font-bold text-green-600">
            Situação atual
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {getSupportStageLabel(stage)}
          </h2>

          <p className="mt-3 text-sm text-slate-600">
            {getStageMessage(stage)}
          </p>

          {latestOrder && (
            <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
              <p className="font-bold">{latestOrder.service.name}</p>
              <p className="text-sm text-slate-600">
                Pedido: {latestOrder.orderCode || latestOrder.id.slice(0, 8)}
              </p>
            </div>
          )}
        </section>

        {/* CHAT */}
        <SupportAssistant stage={stage} />

        {/* FAQ */}
        <section className="rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
          <h2 className="text-xl font-black">
            Dúvidas frequentes
          </h2>

          <div className="mt-4 space-y-3">

            <details className="rounded-2xl border bg-slate-50 p-4">
              <summary className="font-bold cursor-pointer">
                Quanto tempo demora?
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                O prazo pode variar conforme o tipo de serviço e análise necessária.
              </p>
            </details>

            <details className="rounded-2xl border bg-slate-50 p-4">
              <summary className="font-bold cursor-pointer">
                Preciso enviar documentos?
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                Sim. Após o pagamento aprovado, o sistema libera o envio.
              </p>
            </details>

            <details className="rounded-2xl border bg-slate-50 p-4">
              <summary className="font-bold cursor-pointer">
                Quais formas de pagamento?
              </summary>
              <p className="mt-2 text-sm text-slate-600">
                Aceitamos pagamento via Pix com confirmação rápida.
              </p>
            </details>

          </div>
        </section>

      </div>
    </main>
  );
}