import Link from "next/link";

type Props = {
  className?: string;
  size?: "sm" | "md";
};

const INSTAGRAM_URL = "https://www.instagram.com/desenrolagov.oficial/";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61565289068738";

export default function SocialLinks({
  className = "",
  size = "md",
}: Props) {
  const wrapper =
    size === "sm"
      ? "h-10 w-10 rounded-full"
      : "h-11 w-11 rounded-full";

  const icon =
    size === "sm"
      ? "h-4 w-4"
      : "h-5 w-5";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Link
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram da DesenrolaGov"
        className={`inline-flex ${wrapper} items-center justify-center border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={icon}
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </Link>

      <Link
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook da DesenrolaGov"
        className={`inline-flex ${wrapper} items-center justify-center border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={icon}
          aria-hidden="true"
        >
          <path d="M13.5 21v-7h2.3l.4-2.7h-2.7V9.6c0-.8.2-1.3 1.4-1.3h1.5V5.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v1.8H8.5V14H11v7h2.5Z" />
        </svg>
      </Link>
    </div>
  );
}