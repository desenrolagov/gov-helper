import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import DocumentsClient from "./DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.role !== "CLIENT") redirect("/admin/orders");

  return <DocumentsClient user={user} />;
}