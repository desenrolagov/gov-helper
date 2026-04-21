import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import AdminServicesClient from "./AdminServicesClient";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminServicesClient user={user} />;
}