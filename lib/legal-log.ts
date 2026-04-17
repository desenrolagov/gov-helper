import { prisma } from "@/lib/db";

type CreateLegalLogInput = {
  userId: string;
  orderId?: string;
  type: "REGISTER" | "CHECKOUT";
  termsVersion: string;
  privacyVersion: string;
  ip?: string | null;
  userAgent?: string | null;
};

export async function createLegalLog(data: CreateLegalLogInput) {
  await prisma.legalAcceptanceLog.create({
    data: {
      userId: data.userId,
      orderId: data.orderId ?? null,
      type: data.type,
      termsVersion: data.termsVersion,
      privacyVersion: data.privacyVersion,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
    },
  });
}