"use client";

import { useMemo } from "react";

type Props = {
  phone?: string;
  message?: string;
};

function buildWhatsAppHref(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppFloatingButton({
  phone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5517991762888",
  message = "Olá! Preciso de ajuda com meu atendimento no DesenrolaGov.",
}: Props) {
  const href = useMemo(() => {
    return buildWhatsAppHref(phone, message);
  }, [phone, message]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-3 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M19.11 17.23c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.15-1.33-.79-.71-1.33-1.58-1.49-1.84-.16-.27-.02-.41.12-.54.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.52-.44-.45-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.98 2.63 1.11 2.82c.14.18 1.92 2.93 4.65 4.11.65.28 1.15.45 1.55.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z" />
          <path d="M16.01 3.2c-7.06 0-12.79 5.7-12.79 12.73 0 2.25.59 4.45 1.71 6.39L3.2 28.8l6.68-1.74a12.86 12.86 0 0 0 6.13 1.56h.01c7.05 0 12.78-5.7 12.78-12.73S23.07 3.2 16.01 3.2Zm0 23.24h-.01a10.7 10.7 0 0 1-5.45-1.49l-.39-.23-3.96 1.03 1.06-3.86-.25-.4a10.54 10.54 0 0 1-1.65-5.61c0-5.85 4.78-10.61 10.66-10.61 2.84 0 5.51 1.1 7.52 3.1a10.5 10.5 0 0 1 3.13 7.5c0 5.85-4.79 10.61-10.66 10.61Z" />
        </svg>
      </span>

      <span className="hidden sm:inline">Falar no WhatsApp</span>
    </a>
  );
}