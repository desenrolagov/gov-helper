import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.userId,
      },
      select: {
        id: true,
        orderCode: true,
        status: true,
        createdAt: true,
        service: {
          select: {
            name: true,
          },
        },
        uploadedFiles: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            type: true,
            originalName: true,
            url: true,
            createdAt: true,
          },
        },
        resultFiles: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            originalName: true,
            url: true,
            createdAt: true,
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            fileUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sentDocuments = orders.flatMap((order) =>
      order.uploadedFiles.map((file) => ({
        id: file.id,
        kind: "CLIENT_UPLOAD",
        originalName: file.originalName,
        url: file.url,
        createdAt: file.createdAt,
        type: file.type,
        order: {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          serviceName: order.service?.name || "Não identificado",
        },
      }))
    );

    const deliveredDocumentsFromResultFiles = orders.flatMap((order) =>
      order.resultFiles.map((file) => ({
        id: file.id,
        kind: "ADMIN_RESULT",
        originalName: file.originalName,
        url: file.url,
        createdAt: file.createdAt,
        type: "RESULTADO_FINAL",
        order: {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          serviceName: order.service?.name || "Não identificado",
        },
      }))
    );

    const deliveredDocumentsFromLegacyDocuments = orders.flatMap((order) =>
      order.documents.map((file) => ({
        id: file.id,
        kind: "ADMIN_RESULT",
        originalName: file.name,
        url: file.fileUrl,
        createdAt: file.createdAt,
        type: "DOCUMENTO_LIBERADO",
        order: {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          serviceName: order.service?.name || "Não identificado",
        },
      }))
    );

    const deliveredDocuments = [
      ...deliveredDocumentsFromResultFiles,
      ...deliveredDocumentsFromLegacyDocuments,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        sentDocuments,
        deliveredDocuments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar meus documentos:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar documentos." },
      { status: 500 }
    );
  }
}