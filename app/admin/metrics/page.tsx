import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminMetricsDashboard from "./AdminMetricsDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await verifySession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <main className="p-8">
      <AdminMetricsDashboard />
    </main>
  );
}