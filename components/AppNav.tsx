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
  const links =
    user.role === "CLIENT"
      ? [
          { href: "/", label: "Início" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/services", label: "Serviços" },
          { href: "/dashboard/documents", label: "Documentos" },
        ]
      : [
          { href: "/", label: "Início" },
          { href: "/admin", label: "Painel Admin" },
          { href: "/admin/orders", label: "Pedidos" },
          { href: "/admin/services", label: "Serviços" },
        ];

  return (
    <nav className="mb-6 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 md:flex-row md:items-center md:gap-4 md:border-t-0 md:pt-0">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Olá,</p>
            <p className="truncate text-sm font-semibold text-slate-900 md:max-w-[220px]">
              {user.name}
            </p>
          </div>

          <div className="w-full md:w-auto">
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}