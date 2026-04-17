import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { orderCompletedTemplate } from "@/lib/email-templates";
import {
  deletePrivateFile,
  savePrivateFile,
} from "@/lib/private-file-storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

function buildSafeFileName(originalName: string) {
  const originalExtension = path.extname(originalName).toLowerCase();
  const normalizedExtension = originalExtension || ".bin";

  const baseName = path
    .basename(originalName, originalExtension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const finalBaseName = baseName || "arquivo_final";
  return `${finalBaseName}-${Date.now()}${normalizedExtension}`;
}

async function ensureCompletedHistory(orderId: string) {
  const existing = await prisma.orderStatusHistory.findFirst({
    where: {
      orderId,
      status: "COMPLETED",
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: "COMPLETED",
      },
    });
  }
}

async function sendOrderCompletedEmail(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order?.user?.email) return;

    const html = orderCompletedTemplate({
      name: order.user.name,
      orderId: order.id,
    });

    await sendEmail({
      to: order.user.email,
      subject: "Seu pedido foi concluído",
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar email de pedido concluído:", error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  let newSavedFileName: string | null = null;
  let shouldCleanupNewFile = false;

  try {
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

    const { id: orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        userId: true,
        uploadedFiles: {
          select: { id: true },
        },
        payments: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Não é possível enviar resultado final para pedido cancelado." },
        { status: 400 }
      );
    }

    const hasPaid = order.payments.some(
      (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
    );

    if (!hasPaid) {
      return NextResponse.json(
        { error: "Não é possível concluir o pedido sem pagamento confirmado." },
        { status: 400 }
      );
    }

    if (order.uploadedFiles.length <= 0) {
      return NextResponse.json(
        { error: "Não é possível concluir o pedido sem documentos do cliente." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo válido foi enviado." },
        { status: 400 }
      );
    }

    const safeFileName = buildSafeFileName(file.name);
    newSavedFileName = safeFileName;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await savePrivateFile("result", safeFileName, buffer);
    shouldCleanupNewFile = true;

    const createdResultFile = await prisma.orderResultFile.create({
      data: {
        orderId,
        originalName: file.name,
        savedName: safeFileName,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        url: "",
      },
    });

    const updatedResultFile = await prisma.orderResultFile.update({
      where: { id: createdResultFile.id },
      data: {
        url: `/api/files/result/${createdResultFile.id}`,
      },
    });

    shouldCleanupNewFile = false;

    const previousStatus = order.status;

    if (order.status !== "COMPLETED") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
        },
      });
    }

    await ensureCompletedHistory(orderId);
    await sendOrderCompletedEmail(orderId);

    await createAuditLog({
      action: "ORDER_RESULT_FILE_UPLOADED",
      entityType: "order_result_file",
      entityId: updatedResultFile.id,
      userId: session.userId,
      orderId,
      message: "Arquivo final enviado pelo administrador.",
      metadata: {
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        previousStatus,
        nextStatus: "COMPLETED",
      },
    });

    return NextResponse.json(
      {
        message: "Arquivo final enviado com sucesso.",
        file: updatedResultFile,
        status: "COMPLETED",
      },
      { status: 201 }
    );
  } catch (error) {
    if (newSavedFileName && shouldCleanupNewFile) {
      try {
        await deletePrivateFile("result", newSavedFileName);
      } catch (cleanupError) {
        console.error(
          "Erro ao limpar arquivo final após falha:",
          cleanupError
        );
      }
    }

    console.error("Erro ao enviar arquivo final:", error);

    return NextResponse.json(
      { error: "Erro interno ao enviar arquivo final." },
      { status: 500 }
    );
  }
}