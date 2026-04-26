import { ReactNode } from "react";

type DGPageLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function DGPageLayout({ children, className = "" }: DGPageLayoutProps) {
  return (
    <main
      className={`min-h-screen bg-[var(--primary-blue)] text-white ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}