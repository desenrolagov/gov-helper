import { getAppUrl } from "@/lib/app-url";

function baseTemplate(content: string) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
        <div style="margin-bottom:24px;">
          <h2 style="margin:0;font-size:20px;color:#111827;">
            DesenrolaGov
          </h2>
        </div>

        ${content}

        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />

        <p style="font-size:12px;color:#6b7280;">
          Este é um email automático. Caso precise de ajuda, entre em contato com o suporte.
        </p>
      </div>
    </div>
  `;
}

export function paymentApprovedTemplate(data: {
  name: string;
  orderId: string;
}) {
  const appUrl = getAppUrl();

  return baseTemplate(`
    <h1 style="font-size:22px;color:#111827;">
      Pagamento aprovado ✅
    </h1>

    <p style="color:#374151;">
      Olá <strong>${data.name}</strong>,
    </p>

    <p style="color:#374151;">
      Seu pagamento foi confirmado com sucesso.
    </p>

    <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0;">
      <strong>Pedido:</strong> ${data.orderId}
    </div>

    <p style="color:#374151;">
      Agora você já pode enviar os documentos para dar continuidade ao atendimento.
    </p>

    <a href="${appUrl}/orders/${data.orderId}/upload"
       style="display:inline-block;margin-top:16px;padding:12px 20px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;">
       Enviar documentos
    </a>
  `);
}

export function documentsSentTemplate(data: {
  name: string;
  orderId: string;
}) {
  const appUrl = getAppUrl();

  return baseTemplate(`
    <h1 style="font-size:22px;color:#111827;">
      Documentos recebidos 📄
    </h1>

    <p style="color:#374151;">
      Olá <strong>${data.name}</strong>,
    </p>

    <p style="color:#374151;">
      Recebemos seus documentos com sucesso.
    </p>

    <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0;">
      <strong>Pedido:</strong> ${data.orderId}
    </div>

    <p style="color:#374151;">
      Nossa equipe já iniciou a análise e você será notificado assim que houver atualização.
    </p>

    <a href="${appUrl}/orders/${data.orderId}"
       style="display:inline-block;margin-top:16px;padding:12px 20px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;">
       Acompanhar pedido
    </a>
  `);
}

export function orderCompletedTemplate(data: {
  name: string;
  orderId: string;
}) {
  const appUrl = getAppUrl();

  return baseTemplate(`
    <h1 style="font-size:22px;color:#111827;">
      Serviço concluído 🎉
    </h1>

    <p style="color:#374151;">
      Olá <strong>${data.name}</strong>,
    </p>

    <p style="color:#374151;">
      Seu pedido foi finalizado com sucesso.
    </p>

    <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0;">
      <strong>Pedido:</strong> ${data.orderId}
    </div>

    <p style="color:#374151;">
      O resultado já está disponível para acesso.
    </p>

    <a href="${appUrl}/orders/${data.orderId}"
       style="display:inline-block;margin-top:16px;padding:12px 20px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;">
       Ver resultado
    </a>
  `);
}