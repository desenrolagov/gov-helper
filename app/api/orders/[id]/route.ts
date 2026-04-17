import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import type { OrderStatus } from "@/lib/order-flow";
import { canUploadForOrderStatus } from "@/lib/order-status";
import {
  isBusinessHours,
  syncOrderToProcessingIfReady,
} from "@/lib/order-processing";
import {
  getRequiredDocumentsForServiceDynamic,
  getServiceDocumentsDynamic,
  resolveServiceTypeFromService,
} from "@/lib/service-documents";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

function getOrderStep(
  status: OrderStatus,
  hasPaid: boolean,
  hasUploadedFiles: boolean,
  hasResultFiles: boolean
) {
  if (!hasPaid) return "payment";

  if (status === "COMPLETED" || hasResultFiles) {
    return "completed";
  }

  if (status === "PROCESSING") {
    return "analysis";
  }

  if (canUploadForOrderStatus(status)) {
    return hasUploadedFiles ? "analysis" : "upload";
  }

  if (status === "CANCELLED") {
    return "cancelled";
  }

  return "order";
}

async function loadOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      service: true,
      uploadedFiles: {
        orderBy: { createdAt: "desc" },
      },
      histories: {
        orderBy: { createdAt: "desc" },
      },
      resultFiles: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await context.params;

    let order = await loadOrder(id);

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = order.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const hasPaidBeforeSync = order.payments.some(
      (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
    );

    let syncResult:
      | Awaited<ReturnType<typeof syncOrderToProcessingIfReady>>
      | null = null;

    if (
      hasPaidBeforeSync ||
      order.status === "PAID" ||
      order.status === "AWAITING_DOCUMENTS"
    ) {
      syncResult = await syncOrderToProcessingIfReady(id);

      order = await loadOrder(id);

      if (!order) {
        return NextResponse.json(
          { error: "Pedido não encontrado." },
          { status: 404 }
        );
      }
    }

    const normalizedStatus = order.status as OrderStatus;
    const hasPaid = order.payments.some(
      (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
    );
    const hasUploadedFiles = order.uploadedFiles.length > 0;
    const hasResultFiles = order.resultFiles.length > 0;

    const serviceType = order.service
      ? resolveServiceTypeFromService(order.service)
      : null;

    const serviceDocuments =
      order.service && serviceType
        ? await getServiceDocumentsDynamic(order.service.id, serviceType)
        : [];

    const requiredDocuments = serviceDocuments.filter((doc) => doc.required);

    const uploadedTypes = [
      ...new Set(
        order.uploadedFiles
          .map((file) => file.type)
          .filter((value): value is string => Boolean(value))
      ),
    ];

    const hasAllRequiredDocuments =
      requiredDocuments.length > 0 &&
      requiredDocuments.every((doc) => uploadedTypes.includes(doc.key));

    const pendingRequiredDocuments = requiredDocuments.filter(
      (doc) => !uploadedTypes.includes(doc.key)
    );

    const withinBusinessHours =
      syncResult?.withinBusinessHours ?? isBusinessHours();

    const waitingForBusinessHours =
      hasPaid &&
      hasAllRequiredDocuments &&
      !withinBusinessHours &&
      normalizedStatus === "AWAITING_DOCUMENTS";

    const businessHoursNotice = waitingForBusinessHours
      ? "Recebemos todos os documentos obrigatórios fora do horário comercial. Seu pedido está na fila e será assumido pela equipe no próximo período de atendimento."
      : null;

    return NextResponse.json(
      {
        ...order,
        serviceDocuments,
        requiredDocuments,
        pendingRequiredDocuments,
        businessHours: {
          withinBusinessHours,
          waitingForBusinessHours,
          notice: businessHoursNotice,
        },
        flags: {
          isAdmin,
          isOwner,
          hasPaid,
          hasUploadedFiles,
          hasResultFiles,
          hasAllRequiredDocuments,
          canUploadDocuments:
            hasPaid && canUploadForOrderStatus(normalizedStatus),
          isProcessing: normalizedStatus === "PROCESSING",
          isCompleted: normalizedStatus === "COMPLETED",
          isCancelled: normalizedStatus === "CANCELLED",
        },
        flow: {
          currentStep: getOrderStep(
            normalizedStatus,
            hasPaid,
            hasUploadedFiles,
            hasResultFiles
          ),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedido." },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Use a rota /api/orders/[id]/status para atualizar o status do pedido.",
    },
    { status: 405 }
  );
}