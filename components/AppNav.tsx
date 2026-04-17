"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

export default function AppNav({ user }: { user: User }) {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid #ddd",
        marginBottom: "24px",
      }}
    >
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <Link href="/">Início</Link>

        {user.role === "CLIENT" && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/services">Serviços</Link>
            <Link href="/dashboard/documents">Documentos</Link>
          </>
        )}

        {user.role === "ADMIN" && (
          <>
            <Link href="/admin">Painel Admin</Link>
            <Link href="/admin/orders">Pedidos</Link>
            <Link href="/admin/services">Serviços</Link>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span>Olá, {user.name}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}