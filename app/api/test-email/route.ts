import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Rota não disponível." },
        { status: 404 }
      );
    }

    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const target = process.env.TEST_EMAIL_TO?.trim() || session.email;

    if (!target) {
      return NextResponse.json(
        { error: "Email de destino não configurado." },
        { status: 400 }
      );
    }

    await sendEmail({
      to: target,
      subject: "Teste DesenrolaGov",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h1 style="font-size: 20px; margin-bottom: 12px;">Teste de email</h1>
          <p>O envio de email do projeto está funcionando corretamente.</p>
          <p style="margin-top: 16px; color: #666;">
            Ambiente: ${process.env.NODE_ENV}
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Email enviado com sucesso.",
      to: target,
    });
  } catch (error) {
    console.error("Erro ao enviar email de teste:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Falha ao enviar email de teste.",
      },
      { status: 500 }
    );
  }
}