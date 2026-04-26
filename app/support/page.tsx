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
    : "Olá! Preciso de ajuda com meu atendimento na DesenrolaGov.";

  const whatsappHref = buildWhatsAppHref(whatsappMessage);

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
          <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
            Central de suporte
          </div>

          <h1 className="mt-4 text-3xl font-black sm:text-5xl">
            Precisa de ajuda?
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">
            Use o suporte para entender seu pedido, tirar dúvidas sobre envio de
            documentos, pagamento, status do atendimento ou falar com nossa
            equipe pelo WhatsApp.
          </p>

          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
            A DesenrolaGov é uma assessoria privada e não possui vínculo com a
            Receita Federal, gov.br ou qualquer órgão público.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent-green)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
            >
              Falar no WhatsApp
            </a>

            {latestOrder ? (
              <Link
                href={`/orders/${latestOrder.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                Ver meu pedido
              </Link>
            ) : (
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/15"
              >
                Ver serviços
              </Link>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <p className="text-sm font-bold text-[var(--accent-green)]">
              Situação atual
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {getSupportStageLabel(stage)}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {getStageMessage(stage)}
            </p>

            {latestOrder ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-bold text-slate-950">
                  {latestOrder.service.name}
                </p>
                <p className="mt-1 text-slate-600">
                  Pedido: {latestOrder.orderCode || latestOrder.id.slice(0, 8)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <p className="text-sm font-bold text-[var(--accent-green)]">
              O que o suporte pode ajudar
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Como acompanhar meu pedido",
                "Como enviar documentos",
                "Dúvidas sobre pagamento",
                "Dúvidas sobre status",
                "Acesso à conta",
                "Documentos finais",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700"
                >
                  ✔ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <SupportAssistant stage={stage} />

        <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
          <h2 className="text-xl font-black text-slate-950">
            Base do assistente inteligente
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            O assistente deve orientar o cliente sobre etapas, documentos,
            pagamento e acompanhamento, sempre com linguagem simples e sem
            prometer resultado garantido.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="font-black text-green-900">Pode responder</p>
              <ul className="mt-3 space-y-2 text-sm text-green-800">
                <li>✔ Como funciona o atendimento</li>
                <li>✔ Onde acompanhar pedidos</li>
                <li>✔ Como enviar documentos</li>
                <li>✔ Como acessar documentos finais</li>
                <li>✔ Diferença entre assessoria e órgão público</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="font-black text-red-900">Nunca deve prometer</p>
              <ul className="mt-3 space-y-2 text-sm text-red-800">
                <li>✘ Aprovação garantida</li>
                <li>✘ Prazo exato garantido</li>
                <li>✘ Vínculo com órgão público</li>
                <li>✘ Acesso interno a sistemas oficiais</li>
                <li>✘ Solicitar senha gov.br ou código de verificação</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
          <h2 className="text-xl font-black text-slate-950">
            Dúvidas frequentes
          </h2>

          <div className="mt-4 space-y-3">
            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-bold text-slate-950">
                Quanto tempo demora?
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                O prazo pode variar conforme o tipo de serviço, documentação
                enviada e análise necessária. A DesenrolaGov orienta e acompanha
                o fluxo, mas não garante prazo de órgão público.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-bold text-slate-950">
                Preciso enviar documentos?
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sim. Após o pagamento aprovado, o sistema libera a etapa correta
                para envio dos documentos solicitados.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-bold text-slate-950">
                A DesenrolaGov é do governo?
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Não. A DesenrolaGov é uma assessoria privada e não possui vínculo
                com a Receita Federal, gov.br ou qualquer órgão público.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer font-bold text-slate-950">
                É seguro enviar documentos?
              </summary>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Os documentos devem ser enviados apenas dentro da plataforma, na
                área do pedido. Não envie senhas, códigos gov.br ou dados
                sensíveis fora dos canais oficiais da DesenrolaGov.
              </p>
            </details>
          </div>
        </section>
      </div>
    </main>
  );
}