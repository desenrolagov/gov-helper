"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

export default function AppNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);

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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900 sm:text-base">
            GOV Helper
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 md:hidden"
          aria-expanded={open}
          aria-label="Abrir menu"
        >
          {open ? "Fechar" : "Menu"}
        </button>

        <div className="hidden md:flex md:items-center md:gap-6">
          <div className="flex items-center gap-2 lg:gap-3">
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

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="max-w-[180px] lg:max-w-[220px]">
              <p className="text-xs text-slate-500">Olá,</p>
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">Olá,</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
              {user.name}
            </p>

            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}