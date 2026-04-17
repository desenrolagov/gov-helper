import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { readPrivateFile } from "@/lib/private-file-storage";
import {
  forbidden,
  notFound,
  serverError,
  unauthorized,
} from "@/lib/http";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;

    const file = await prisma.uploadedFile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orderId: true,
        originalName: true,
        savedName: true,
        mimeType: true,
        size: true,
      },
    });

    if (!file || !file.savedName) {
      return notFound("Arquivo enviado não encontrado.");
    }

    const order = await prisma.order.findUnique({
      where: { id: file.orderId },
      select: {
        userId: true,
      },
    });

    if (!order) {
      return notFound("Pedido não encontrado.");
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = order.userId === user.id;

    if (!isAdmin && !isOwner) {
      return forbidden();
    }

    const buffer = await readPrivateFile("uploads", file.savedName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(file.size || buffer.length),
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          file.originalName
        )}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Erro ao servir arquivo protegido do cliente:", error);
    return serverError("Erro ao abrir arquivo enviado.");
  }
}