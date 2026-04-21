import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import AdminMetricsDashboard from "./AdminMetricsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminMetricsPage() {
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminMetricsDashboard />
      </main>
    </div>
  );
}