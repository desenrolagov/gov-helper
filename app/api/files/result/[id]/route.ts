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

function buildContentDisposition(filename: string, asAttachment: boolean) {
  const safeFallback = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  const encoded = encodeURIComponent(filename);
  const type = asAttachment ? "attachment" : "inline";

  return `${type}; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return unauthorized();
    }

    const { id } = await context.params;
    const asAttachment = req.nextUrl.searchParams.get("download") === "1";

    const file = await prisma.orderResultFile.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        originalName: true,
        savedName: true,
        mimeType: true,
        size: true,
      },
    });

    if (!file || !file.savedName) {
      return notFound("Arquivo final não encontrado.");
    }

    const order = await prisma.order.findUnique({
      where: { id: file.orderId },
      select: {
        userId: true,
        status: true,
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

    if (!isAdmin && order.status !== "COMPLETED") {
      return forbidden("Arquivo ainda não liberado.");
    }

    const buffer = await readPrivateFile("result", file.savedName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(file.size || buffer.length),
        "Content-Disposition": buildContentDisposition(
          file.originalName,
          asAttachment
        ),
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Erro ao servir resultado final protegido:", error);
    return serverError("Erro ao abrir arquivo final.");
  }
}