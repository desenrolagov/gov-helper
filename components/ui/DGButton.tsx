import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type DGButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "dark";
  full?: boolean;
};

export function DGButton({
  children,
  href,
  variant = "primary",
  full = false,
  className = "",
  ...props
}: DGButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-bold transition active:scale-[0.98]";

  const variants = {
    primary:
      "bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green-hover)] shadow-lg shadow-green-950/20",
    secondary:
      "border border-white/25 bg-white/10 text-white hover:bg-white/15",
    dark:
      "bg-[var(--primary-blue-strong)] text-white hover:bg-slate-900",
  };

  const width = full ? "w-full" : "";

  const classes = `${base} ${variants[variant]} ${width} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}