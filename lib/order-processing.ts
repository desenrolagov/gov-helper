import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/order-flow";
import {
  getRequiredDocumentsForServiceDynamic,
  resolveServiceTypeFromService,
} from "@/lib/service-documents";

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

type ProcessingSyncResult = {
  found: boolean;
  status: OrderStatus | null;
  hasPaid: boolean;
  hasAllRequiredDocs: boolean;
  withinBusinessHours: boolean;
  movedToProcessing: boolean;
  serviceType: ReturnType<typeof resolveServiceTypeFromService> | null;
};

function getSaoPauloDate() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    })
  );
}

export function isBusinessHours() {
  const now = getSaoPauloDate();
  const day = now.getDay();
  const hour = now.getHours();

  const isWeekday = day >= 1 && day <= 5;

  return isWeekday && hour >= 8 && hour < 18;
}

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
    data: {
      status: nextStatus,
    },
  });

  await ensureStatusHistory(orderId, nextStatus);
  return true;
}

export async function syncOrderToProcessingIfReady(
  orderId: string
): Promise<ProcessingSyncResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      service: {
        select: {
          id: true,
          name: true,
          type: true,
          codePrefix: true,
          requiresScheduleReview: true,
        },
      },
      uploadedFiles: {
        select: {
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
    return {
      found: false,
      status: null,
      hasPaid: false,
      hasAllRequiredDocs: false,
      withinBusinessHours: isBusinessHours(),
      movedToProcessing: false,
      serviceType: null,
    };
  }

  if (!order.service) {
    return {
      found: true,
      status: order.status as OrderStatus,
      hasPaid: false,
      hasAllRequiredDocs: false,
      withinBusinessHours: isBusinessHours(),
      movedToProcessing: false,
      serviceType: null,
    };
  }

  const currentStatus = order.status as OrderStatus;
  const serviceType = resolveServiceTypeFromService(order.service);
  const withinBusinessHours = isBusinessHours();

  const hasPaid = order.payments.some(
    (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
  );

  const requiredDocs = await getRequiredDocumentsForServiceDynamic(
    order.service.id,
    serviceType
  );

  const uploadedTypes = [
    ...new Set(
      order.uploadedFiles
        .map((file: { type: string | null }) => file.type)
        .filter((value: string | null): value is string => Boolean(value))
    ),
  ];

  const hasAllRequiredDocs =
    requiredDocs.length > 0 &&
    requiredDocs.every((doc) => uploadedTypes.includes(doc.key));

  if (currentStatus === "CANCELLED") {
    return {
      found: true,
      status: "CANCELLED",
      hasPaid,
      hasAllRequiredDocs,
      withinBusinessHours,
      movedToProcessing: false,
      serviceType,
    };
  }

  if (currentStatus === "COMPLETED") {
    return {
      found: true,
      status: "COMPLETED",
      hasPaid,
      hasAllRequiredDocs,
      withinBusinessHours,
      movedToProcessing: false,
      serviceType,
    };
  }

  if (!hasPaid) {
    return {
      found: true,
      status: currentStatus,
      hasPaid: false,
      hasAllRequiredDocs,
      withinBusinessHours,
      movedToProcessing: false,
      serviceType,
    };
  }

  if (!hasAllRequiredDocs) {
    await updateOrderStatusIfNeeded(orderId, "AWAITING_DOCUMENTS");

    return {
      found: true,
      status: "AWAITING_DOCUMENTS",
      hasPaid: true,
      hasAllRequiredDocs: false,
      withinBusinessHours,
      movedToProcessing: false,
      serviceType,
    };
  }

  if (!withinBusinessHours) {
    await updateOrderStatusIfNeeded(orderId, "AWAITING_DOCUMENTS");

    return {
      found: true,
      status: "AWAITING_DOCUMENTS",
      hasPaid: true,
      hasAllRequiredDocs: true,
      withinBusinessHours: false,
      movedToProcessing: false,
      serviceType,
    };
  }

  const serviceName = order.service.name.toLowerCase();

  const requiresScheduleReview =
    order.service.requiresScheduleReview ||
    serviceType === "RG" ||
    order.service.type === "RG" ||
    order.service.codePrefix === "RG" ||
    serviceName.includes("rg") ||
    serviceName.includes("poupatempo") ||
    serviceName.includes("poupa tempo");

  if (requiresScheduleReview) {
    const movedToScheduleReview = await updateOrderStatusIfNeeded(
      orderId,
      "WAITING_OPERATOR_SCHEDULE_REVIEW"
    );

    return {
      found: true,
      status: "WAITING_OPERATOR_SCHEDULE_REVIEW",
      hasPaid: true,
      hasAllRequiredDocs: true,
      withinBusinessHours: true,
      movedToProcessing: movedToScheduleReview,
      serviceType,
    };
  }

  const movedToProcessing = await updateOrderStatusIfNeeded(
    orderId,
    "PROCESSING"
  );

  return {
    found: true,
    status: "PROCESSING",
    hasPaid: true,
    hasAllRequiredDocs: true,
    withinBusinessHours: true,
    movedToProcessing,
    serviceType,
  };
}