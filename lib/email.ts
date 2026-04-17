import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY?.trim() || "";
const emailFrom =
  process.env.EMAIL_FROM?.trim() || "DesenrolaGov <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

type ResendSuccessResponse = {
  id?: string;
};

type ResendErrorResponse = {
  error?: {
    name?: string;
    message?: string;
  };
};

function isResendErrorResponse(
  value: unknown
): value is ResendErrorResponse {
  return typeof value === "object" && value !== null && "error" in value;
}

function isResendSuccessResponse(
  value: unknown
): value is ResendSuccessResponse {
  return typeof value === "object" && value !== null;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailInput): Promise<ResendSuccessResponse> {
  if (!resend) {
    console.error("Email não enviado: RESEND_API_KEY não configurada.");
    throw new Error("Serviço de email não configurado.");
  }

  const normalizedTo = to?.trim();
  const normalizedSubject = subject?.trim();
  const normalizedHtml = html?.trim();

  if (!normalizedTo) {
    throw new Error("Destinatário do email não informado.");
  }

  if (!normalizedSubject) {
    throw new Error("Assunto do email não informado.");
  }

  if (!normalizedHtml) {
    throw new Error("Conteúdo HTML do email não informado.");
  }

  try {
    const response = await resend.emails.send({
      from: emailFrom,
      to: [normalizedTo],
      subject: normalizedSubject,
      html: normalizedHtml,
    });

    if (isResendErrorResponse(response) && response.error) {
      console.error("Erro retornado pelo Resend:", response.error);
      throw new Error(response.error.message || "Falha ao enviar email.");
    }

    if (!isResendSuccessResponse(response)) {
      throw new Error("Resposta inválida do serviço de email.");
    }

    return response;
  } catch (error) {
    console.error("Erro ao enviar email:", {
      to: normalizedTo,
      subject: normalizedSubject,
      error,
    });

    throw error;
  }
}