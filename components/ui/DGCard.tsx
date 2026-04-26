import { ReactNode } from "react";

type DGCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "white" | "dark" | "soft";
};

export function DGCard({
  children,
  className = "",
  variant = "white",
}: DGCardProps) {
  const variants = {
    white:
      "bg-white text-[var(--text-dark)] border border-slate-200 shadow-xl shadow-slate-950/10",
    dark:
      "bg-[var(--primary-blue-strong)] text-white border border-white/10 shadow-xl shadow-black/20",
    soft:
      "bg-white/10 text-white border border-white/15 backdrop-blur shadow-xl shadow-black/10",
  };

  return (
    <div className={`rounded-3xl p-6 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}