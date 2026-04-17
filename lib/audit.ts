import { prisma } from "@/lib/db";

type AuditInput = {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string | null;
  orderId?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

type AuditMetadataField = NonNullable<
  Parameters<typeof prisma.auditLog.create>[0]["data"]["metadata"]
>;

function toAuditMetadata(
  value: Record<string, unknown> | null | undefined
): AuditMetadataField | undefined {
  if (value == null) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as AuditMetadataField;
}

export async function createAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.userId != null ? { userId: input.userId } : {}),
        ...(input.orderId != null ? { orderId: input.orderId } : {}),
        ...(input.message != null ? { message: input.message } : {}),
        ...(input.metadata != null
          ? { metadata: toAuditMetadata(input.metadata) }
          : {}),
      },
    });
  } catch (error) {
    console.error("Erro ao criar log de auditoria:", error);
  }
}