"use client";

import Link from "next/link";
import AppNav from "@/components/AppNav";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

export default function AdminClient({ user }: { user: User }) {
  return (
    <div>
      <AppNav user={user} />

      <main style={{ padding: "24px" }}>
        <h1>Painel Administrativo</h1>
        <p>Bem-vindo, {user.name}</p>

        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <Link href="/admin/orders">Gerenciar pedidos</Link>
          <Link href="/admin/services">Gerenciar serviços</Link>
        </div>
      </main>
    </div>
  );
}