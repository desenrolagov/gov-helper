import {
  buildRateLimitKey,
  createRateLimitResponse,
  rateLimit,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { validateFile } from "@/lib/uploadValidation";
import type { OrderStatus } from "@/lib/order-flow";
import { canUploadForOrderStatus } from "@/lib/order-status";
import {
  getRequiredDocumentsForServiceDynamic,
  isDocumentAllowedForServiceDynamic,
  isValidDocumentType,
  resolveServiceTypeFromService,
} from "@/lib/service-documents";
import { syncOrderToProcessingIfReady } from "@/lib/order-processing";
import {
  deletePrivateFile,
  savePrivateFile,
} from "@/lib/private-file-storage";
import { sendEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { getAppUrl } from "@/lib/app-url";

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

type UploadedFileSummary = {
  id: string;
  type: string;
  originalName: string;
  url: string;
  createdAt: Date;
};

async function ensureStatusHistory(orderId: string, status: OrderStatus) {
  const existing = await prisma.orderStatusHistory.findFirst({
    where: { orderId, status },
    select: { id: true },
  });

  if (!existing) {
    await prisma.orderStatusHistory.create({
      data: { orderId, status },
    });
  }
}

async function updateOrderStatusIfNeeded(
  orderId: string,
  nextStatus: OrderStatus
) {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!current) return false;

  if (current.status === nextStatus) {
    await ensureStatusHistory(orderId, nextStatus);
    return false;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  await ensureStatusHistory(orderId, nextStatus);
  return true;
}

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

  const finalBaseName = baseName || "arquivo";
  return `${finalBaseName}-${Date.now()}${normalizedExtension}`;
}

function buildDocumentsReceivedEmailHtml(data: {
  name: string;
  orderId: string;
  withinBusinessHours: boolean;
  appUrl: string;
}) {
  const statusText = data.withinBusinessHours
    ? "Recebemos seus documentos com sucesso e seu pedido já foi encaminhado para análise da equipe."
    : "Recebemos seus documentos com sucesso. Como o envio foi realizado fora do horário comercial, seu pedido ficará na fila e será assumido pela equipe no próximo período de atendimento.";

  return `
    <div style="font-family: Arial, sans-serif; background:#f6f7f9; padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
        <h2 style="margin:0 0 16px 0;font-size:20px;color:#111827;">DesenrolaGov</h2>

        <h1 style="font-size:22px;color:#111827;margin:0 0 16px 0;">
          Documentos recebidos 📄
        </h1>

        <p style="color:#374151;">
          Olá <strong>${data.name}</strong>,
        </p>

        <p style="color:#374151;">
          ${statusText}
        </p>

        <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0;">
          <strong>Pedido:</strong> ${data.orderId}
        </div>

        <a
          href="${data.appUrl}/orders/${data.orderId}"
          style="display:inline-block;margin-top:16px;padding:12px 20px;background:#111827;color:#fff;border-radius:8px;text-decoration:none;"
        >
          Acompanhar pedido
        </a>

        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />

        <p style="font-size:12px;color:#6b7280;">
          Este é um email automático. Caso precise de ajuda, entre em contato com o suporte.
        </p>
      </div>
    </div>
  `;
}

async function sendDocumentsReceivedEmail(data: {
  orderId: string;
  withinBusinessHours: boolean;
}) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
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

    const appUrl = await getAppUrl();

    await sendEmail({
      to: order.user.email,
      subject: data.withinBusinessHours
        ? "Documentos recebidos e em análise"
        : "Documentos recebidos com sucesso",
      html: buildDocumentsReceivedEmailHtml({
        name: order.user.name,
        orderId: order.id,
        withinBusinessHours: data.withinBusinessHours,
        appUrl,
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar email de documentos recebidos:", error);
  }
}

export async function POST(req: Request) {
  let newSavedFileName: string | null = null;
  let shouldCleanupNewFile = false;

  try {
    const rateLimitResult = rateLimit(buildRateLimitKey("upload", req), {
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const orderId = formData.get("orderId")?.toString().trim();
    const type = formData.get("type")?.toString().trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo válido foi enviado." },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Tipo do documento não informado." },
        { status: 400 }
      );
    }

    if (!isValidDocumentType(type)) {
      return NextResponse.json(
        { error: "Tipo de documento inválido." },
        { status: 400 }
      );
    }

    const validation = validateFile(file);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Arquivo inválido." },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        lgpdAccepted: true,
        lgpdAcceptedAt: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        legalAcceptedVersion: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    if (dbUser.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Somente clientes podem enviar arquivos." },
        { status: 403 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: dbUser.id,
      },
      select: {
        id: true,
        status: true,
        userId: true,
        termsAccepted: true,
        privacyAccepted: true,
        legalAcceptedVersion: true,
        service: {
          select: {
            id: true,
            name: true,
            codePrefix: true,
            type: true,
          },
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
        { error: "Pedido não encontrado para este usuário." },
        { status: 404 }
      );
    }

    if (!order.service) {
      return NextResponse.json(
        { error: "Serviço do pedido não encontrado." },
        { status: 400 }
      );
    }

    const hasValidUserLegalAcceptance =
      dbUser.lgpdAccepted === true &&
      !!dbUser.lgpdAcceptedAt &&
      !!dbUser.termsAcceptedAt &&
      !!dbUser.privacyAcceptedAt;

    if (!hasValidUserLegalAcceptance) {
      return NextResponse.json(
        {
          error:
            "Seu cadastro ainda não possui aceite legal válido. Faça login novamente ou atualize seu cadastro antes de enviar documentos.",
        },
        { status: 403 }
      );
    }

    if (!order.termsAccepted || !order.privacyAccepted) {
      return NextResponse.json(
        {
          error:
            "Este pedido ainda não possui os aceites legais obrigatórios. Retorne à etapa de pagamento e confirme os termos antes de continuar.",
        },
        { status: 403 }
      );
    }

    const currentStatus = order.status as OrderStatus;

    const hasPaid = order.payments.some(
      (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
    );

    if (!hasPaid) {
      return NextResponse.json(
        { error: "O pedido ainda não possui pagamento confirmado." },
        { status: 400 }
      );
    }

    if (!canUploadForOrderStatus(currentStatus)) {
      return NextResponse.json(
        { error: "Este pedido não aceita envio de arquivos nesta etapa." },
        { status: 400 }
      );
    }

    const serviceType = resolveServiceTypeFromService(order.service);

    const isAllowed = await isDocumentAllowedForServiceDynamic(
      order.service.id,
      serviceType,
      type
    );

    if (!isAllowed) {
      return NextResponse.json(
        {
          error:
            "Este tipo de documento não faz parte dos documentos aceitos para este serviço.",
        },
        { status: 400 }
      );
    }

    const requiredDocs = await getRequiredDocumentsForServiceDynamic(
      order.service.id,
      serviceType
    );

    const uploadedFilesBefore = await prisma.uploadedFile.findMany({
      where: { orderId },
      select: {
        type: true,
      },
    });

    const uploadedTypesBefore = [
      ...new Set(
        uploadedFilesBefore
          .map((item: { type: string | null }) => item.type)
          .filter((value: string | null): value is string => Boolean(value))
      ),
    ];

    const hadAllRequiredDocsBefore =
      requiredDocs.length > 0 &&
      requiredDocs.every((doc) => uploadedTypesBefore.includes(doc.key));

    const existingSameType = await prisma.uploadedFile.findFirst({
      where: {
        orderId,
        userId: dbUser.id,
        type,
      },
      select: {
        id: true,
        savedName: true,
      },
    });

    const safeFileName = buildSafeFileName(file.name);
    newSavedFileName = safeFileName;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await savePrivateFile("uploads", safeFileName, buffer);
    shouldCleanupNewFile = true;

    let savedFile;

    if (existingSameType) {
      savedFile = await prisma.uploadedFile.update({
        where: { id: existingSameType.id },
        data: {
          type,
          originalName: file.name,
          savedName: safeFileName,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          url: `/api/files/uploaded/${existingSameType.id}`,
        },
      });

      shouldCleanupNewFile = false;

      try {
        await deletePrivateFile("uploads", existingSameType.savedName);
      } catch (error) {
        console.error("Erro ao remover arquivo antigo substituído:", error);
      }
    } else {
      savedFile = await prisma.uploadedFile.create({
        data: {
          userId: dbUser.id,
          orderId,
          type,
          originalName: file.name,
          savedName: safeFileName,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          url: "",
        },
      });

      savedFile = await prisma.uploadedFile.update({
        where: { id: savedFile.id },
        data: {
          url: `/api/files/uploaded/${savedFile.id}`,
        },
      });

      shouldCleanupNewFile = false;
    }

    const uploadedFiles: UploadedFileSummary[] =
      await prisma.uploadedFile.findMany({
        where: { orderId },
        select: {
          id: true,
          type: true,
          originalName: true,
          url: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    const uploadedTypes = [...new Set(uploadedFiles.map((item) => item.type))];

    const pendingDocuments = requiredDocs.filter(
      (doc) => !uploadedTypes.includes(doc.key)
    );

    if (pendingDocuments.length > 0) {
      await updateOrderStatusIfNeeded(orderId, "AWAITING_DOCUMENTS");
    }

    const syncResult = await syncOrderToProcessingIfReady(orderId);

    const hasAllRequiredDocuments = pendingDocuments.length === 0;
    const waitingForBusinessHours =
      hasAllRequiredDocuments &&
      !syncResult.withinBusinessHours &&
      syncResult.status === "AWAITING_DOCUMENTS";

    const shouldSendReceivedNotification =
      hasAllRequiredDocuments && !hadAllRequiredDocsBefore;

    if (shouldSendReceivedNotification) {
      await sendDocumentsReceivedEmail({
        orderId,
        withinBusinessHours: syncResult.withinBusinessHours,
      });
    }

    const responseMessage = existingSameType
      ? "Documento atualizado com sucesso."
      : hasAllRequiredDocuments &&
          syncResult.status === "WAITING_OPERATOR_SCHEDULE_REVIEW"
        ? "Todos os documentos obrigatórios foram enviados. Agora nossa equipe irá localizar a unidade Poupatempo e horários disponíveis."
        : hasAllRequiredDocuments && syncResult.withinBusinessHours
          ? "Todos os documentos obrigatórios foram enviados. Seu pedido foi encaminhado para análise."
          : hasAllRequiredDocuments && !syncResult.withinBusinessHours
            ? "Recebemos todos os documentos obrigatórios. Como o envio ocorreu fora do horário comercial, seu pedido ficará na fila e será assumido pela equipe no próximo período de atendimento."
            : "Documento enviado com sucesso.";

    try {
      await createAuditLog({
        action: existingSameType ? "DOCUMENT_UPDATED" : "DOCUMENT_UPLOADED",
        entityType: "uploaded_file",
        entityId: savedFile.id,
        userId: dbUser.id,
        orderId,
        message: existingSameType
          ? "Documento do cliente atualizado."
          : "Documento do cliente enviado.",
        metadata: {
          type,
          originalName: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          pendingDocuments: pendingDocuments.map((doc) => doc.key),
          movedToProcessing: syncResult.movedToProcessing,
          resultingStatus: syncResult.status,
          withinBusinessHours: syncResult.withinBusinessHours,
          waitingForBusinessHours,
          hasAllRequiredDocuments,
        },
      });
    } catch (error) {
      console.error("Erro ao gravar auditoria do upload:", error);
    }

    return NextResponse.json(
      {
        message: responseMessage,
        file: savedFile,
        uploadedFiles,
        requiredDocuments: requiredDocs,
        pendingDocuments,
        status: syncResult.status,
        movedToProcessing: syncResult.movedToProcessing,
        withinBusinessHours: syncResult.withinBusinessHours,
        waitingForBusinessHours,
        hasAllRequiredDocuments,
      },
      { status: 200 }
    );
  } catch (error) {
    if (newSavedFileName && shouldCleanupNewFile) {
      try {
        await deletePrivateFile("uploads", newSavedFileName);
      } catch (cleanupError) {
        console.error(
          "Erro ao limpar arquivo após falha no upload:",
          cleanupError
        );
      }
    }

    console.error("Erro ao enviar arquivo:", error);

    return NextResponse.json(
      { error: "Erro interno ao enviar arquivo." },
      { status: 500 }
    );
  }
}