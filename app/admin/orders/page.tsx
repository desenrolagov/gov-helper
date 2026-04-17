import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import AdminOrdersClient from "./AdminOrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Painel administrativo
          </div>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Gestão de pedidos
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Acompanhe os pedidos, atualize o andamento operacional, revise os
            documentos enviados pelos clientes e finalize as entregas.
          </p>
        </div>

        <AdminOrdersClient />
      </main>
    </div>
  );
}