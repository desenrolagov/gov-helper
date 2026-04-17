import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import ServicesClient from "./ServicesClient";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 🔥 ADMIN NÃO DEVE USAR ESSA TELA
  if (user.role === "ADMIN") {
    redirect("/admin/services");
  }

  return <ServicesClient user={user} />;
}