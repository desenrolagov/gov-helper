import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncOrderToProcessingIfReady } from "@/lib/order-processing";

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET não configurado." },
        { status: 500 }
      );
    }

    const bearerToken = getBearerToken(req);

    if (!bearerToken || bearerToken !== cronSecret) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 401 }
      );
    }

    const candidateOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ["PAID", "AWAITING_DOCUMENTS"],
        },
      },
      select: {
        id: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    let checked = 0;
    let movedToProcessing = 0;
    let keptAwaitingDocuments = 0;
    let alreadyStable = 0;
    let errors = 0;

    const results: Array<{
      orderId: string;
      beforeStatus: string;
      afterStatus: string | null;
      movedToProcessing: boolean;
      hasPaid: boolean;
      hasAllRequiredDocs: boolean;
      withinBusinessHours: boolean;
      error?: string;
    }> = [];

    for (const order of candidateOrders) {
      checked++;

      try {
        const syncResult = await syncOrderToProcessingIfReady(order.id);

        if (!syncResult.found) {
          results.push({
            orderId: order.id,
            beforeStatus: order.status,
            afterStatus: null,
            movedToProcessing: false,
            hasPaid: false,
            hasAllRequiredDocs: false,
            withinBusinessHours: false,
            error: "Pedido não encontrado durante sincronização.",
          });
          errors++;
          continue;
        }

        if (syncResult.movedToProcessing || syncResult.status === "PROCESSING") {
          movedToProcessing++;
        } else if (syncResult.status === "AWAITING_DOCUMENTS") {
          keptAwaitingDocuments++;
        } else {
          alreadyStable++;
        }

        results.push({
          orderId: order.id,
          beforeStatus: order.status,
          afterStatus: syncResult.status,
          movedToProcessing: syncResult.movedToProcessing,
          hasPaid: syncResult.hasPaid,
          hasAllRequiredDocs: syncResult.hasAllRequiredDocs,
          withinBusinessHours: syncResult.withinBusinessHours,
        });
      } catch (error) {
        errors++;

        results.push({
          orderId: order.id,
          beforeStatus: order.status,
          afterStatus: null,
          movedToProcessing: false,
          hasPaid: false,
          hasAllRequiredDocs: false,
          withinBusinessHours: false,
          error:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao sincronizar pedido.",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        summary: {
          checked,
          movedToProcessing,
          keptAwaitingDocuments,
          alreadyStable,
          errors,
        },
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao processar pedidos prontos:", error);

    return NextResponse.json(
      { error: "Erro interno ao processar pedidos." },
      { status: 500 }
    );
  }
}