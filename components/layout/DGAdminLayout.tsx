import { ReactNode } from "react";

type DGAdminLayoutProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

export function DGAdminLayout({
  children,
  title,
  description,
}: DGAdminLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20">
          <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-xs font-bold text-emerald-300">
            Painel administrativo
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
              {description}
            </p>
          )}
        </section>

        <div className="space-y-6">{children}</div>
      </div>
    </main>
  );
}