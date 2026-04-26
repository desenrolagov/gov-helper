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
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <section className="mb-6 rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20">

          <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
            Painel administrativo
          </div>

          <h1 className="mt-4 text-3xl font-black">
            Gestão de pedidos
          </h1>

          <p className="mt-3 text-sm text-white/70">
            Controle total do fluxo: pagamento, documentos, andamento e entrega final.
          </p>

        </section>

        <AdminOrdersClient />

      </main>
    </div>
  );
}