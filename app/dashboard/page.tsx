import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderActionButton from "@/components/OrderActionButton";
import {
  getOrderFlow,
  getOrderToneClasses,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CLIENT") {
    redirect("/admin/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      service: true,
      uploadedFiles: true,
      resultFiles: true,
    },
  });

  const latestOrder = orders[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!latestOrder ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold">Nenhum pedido encontrado</h2>
          </div>
        ) : (
          (() => {
            if (!isValidOrderStatus(latestOrder.status)) return null;

            const status = latestOrder.status as OrderStatus;

            const flow = getOrderFlow(status, {
              orderId: latestOrder.id,
              filesCount: latestOrder.uploadedFiles.length,
              resultFilesCount: latestOrder.resultFiles.length,
            });

            const tone = getOrderToneClasses(flow.tone);

            return (
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">
                    {latestOrder.service.name}
                  </h2>

                  <OrderStatusBadge status={status} />
                </div>

                <p className="mt-4 text-slate-600">
                  {flow.clientMessage}
                </p>

                <div className={`mt-6 rounded-2xl border p-4 ${tone.soft}`}>
                  <p className="text-sm font-medium">
                    Próxima etapa:
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {flow.nextStepLabel}
                  </p>
                </div>

                <div className="mt-6">
                  <OrderActionButton
                    status={status}
                    orderId={latestOrder.id}
                    filesCount={latestOrder.uploadedFiles.length}
                    resultFilesCount={latestOrder.resultFiles.length}
                    className="w-full"
                  />
                </div>
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
}