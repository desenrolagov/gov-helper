import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import AdminFinanceDashboard from "./AdminFinanceDashboard";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <AdminFinanceDashboard />
    </main>
  );
}