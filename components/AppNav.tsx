"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

type NavLink = {
  href: string;
  label: string;
  shortLabel?: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "DG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function AppNav({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links: NavLink[] =
    user.role === "CLIENT"
      ? [
          { href: "/", label: "Início" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/services", label: "Serviços" },
          { href: "/dashboard/documents", label: "Documentos" },
        ]
      : [
          { href: "/", label: "Início" },
          { href: "/admin", label: "Painel Admin", shortLabel: "Admin" },
          { href: "/admin/orders", label: "Pedidos" },
          { href: "/admin/services", label: "Serviços" },
          { href: "/admin/finance", label: "Financeiro" },
          { href: "/admin/metrics", label: "Métricas" },
        ];

  const userInitials = useMemo(() => getInitials(user.name), [user.name]);

  function isActiveLink(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
              DG
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                DesenrolaGov
              </p>
              <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                {user.role === "ADMIN"
                  ? "Painel administrativo"
                  : "Área do cliente"}
              </p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] md:hidden"
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? "Fechar" : "Menu"}
        </button>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 md:flex">
          <div className="flex flex-wrap items-center gap-2">
            {links.map((link) => {
              const active = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="hidden lg:inline">
                    {link.label}
                  </span>
                  <span className="lg:hidden">
                    {link.shortLabel || link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
              {userInitials}
            </div>

            <div className="max-w-[180px] lg:max-w-[220px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Conectado como
              </p>
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>

            <div className="shrink-0">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-4 shadow-xl md:hidden">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {userInitials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {user.role === "ADMIN" ? "Administrador" : "Cliente"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {links.map((link) => {
              const active = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <div onClick={() => setOpen(false)}>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}