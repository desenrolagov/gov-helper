import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import AdminServicesClient from "./AdminServicesClient";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const user = await getCurrentUser();

  // 🔒 Proteção: precisa estar logado
  if (!user) {
    redirect("/login");
  }

  // 🔒 Proteção: precisa ser ADMIN
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminServicesClient user={user} />;
}