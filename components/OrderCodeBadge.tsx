"use client";

type Props = {
  code?: string | null;
  fallback?: string;
  className?: string;
};

export default function OrderCodeBadge({
  code,
  fallback = "—",
  className = "",
}: Props) {
  const display = code && code.trim() !== "" ? code : fallback;

  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ${className}`}
    >
      {display}
    </span>
  );
}