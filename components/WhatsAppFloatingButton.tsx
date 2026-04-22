"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  phone?: string;
  message?: string;
};

function buildWhatsAppHref(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function shouldHideOnPath(pathname: string) {
  const hiddenPrefixes = [
    "/admin",
    "/login",
    "/register",
    "/checkout",
    "/payment",
  ];

  return hiddenPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function getContextMessage(pathname: string, fallback?: string) {
  if (fallback?.trim()) return fallback.trim();

  if (pathname === "/") {
    return "Olá! Quero tirar dúvidas sobre os serviços da DesenrolaGov.";
  }

  if (pathname.startsWith("/support")) {
    return "Olá! Preciso de ajuda com meu atendimento na DesenrolaGov.";
  }

  if (pathname.startsWith("/orders/")) {
    return "Olá! Preciso de ajuda com o andamento do meu pedido na DesenrolaGov.";
  }

  if (pathname.startsWith("/services")) {
    return "Olá! Quero entender melhor como funciona o serviço da DesenrolaGov.";
  }

  if (pathname.startsWith("/dashboard")) {
    return "Olá! Preciso de ajuda com minha área do cliente na DesenrolaGov.";
  }

  return "Olá! Preciso de ajuda com meu atendimento na DesenrolaGov.";
}

function getBubbleCopy(pathname: string) {
  if (pathname === "/") {
    return {
      title: "Fale com a gente",
      text: "Tire dúvidas sobre o serviço antes de contratar.",
    };
  }

  if (pathname.startsWith("/support")) {
    return {
      title: "Suporte rápido",
      text: "Se precisar, fale com nosso atendimento no WhatsApp.",
    };
  }

  if (pathname.startsWith("/orders/")) {
    return {
      title: "Ajuda com seu pedido",
      text: "Fale com o suporte sobre andamento e próximas etapas.",
    };
  }

  return {
    title: "Precisa de ajuda?",
    text: "Fale com nosso atendimento no WhatsApp.",
  };
}

export default function WhatsAppFloatingButton({
  phone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "5517991762888",
  message,
}: Props) {
  const pathname = usePathname();
  const [showBubble, setShowBubble] = useState(false);

  const dynamicMessage = useMemo(() => {
    return getContextMessage(pathname, message);
  }, [pathname, message]);

  const bubbleCopy = useMemo(() => {
    return getBubbleCopy(pathname);
  }, [pathname]);

  const href = useMemo(() => {
    return buildWhatsAppHref(phone, dynamicMessage);
  }, [phone, dynamicMessage]);

  useEffect(() => {
    setShowBubble(false);

    const timer = setTimeout(() => {
      setShowBubble(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (shouldHideOnPath(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {showBubble ? (
        <div className="hidden max-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {bubbleCopy.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {bubbleCopy.text}
          </p>
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="group inline-flex items-center justify-center rounded-full bg-green-500 text-white shadow-[0_10px_30px_rgba(34,197,94,0.35)] transition hover:scale-[1.03] hover:bg-green-600 sm:rounded-2xl"
      >
        <span className="flex h-14 w-14 items-center justify-center sm:hidden">
          <svg
            viewBox="0 0 32 32"
            className="h-7 w-7 fill-current"
            aria-hidden="true"
          >
            <path d="M19.11 17.21c-.28-.14-1.65-.82-1.91-.91-.25-.09-.44-.14-.62.14-.18.28-.71.91-.87 1.1-.16.18-.32.21-.6.07-.28-.14-1.16-.43-2.21-1.38-.81-.72-1.36-1.61-1.52-1.89-.16-.28-.02-.43.12-.57.13-.13.28-.32.41-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.5-.07-.14-.62-1.49-.85-2.04-.22-.52-.45-.45-.62-.45h-.53c-.18 0-.46.07-.71.35-.25.28-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.84.14.18 1.93 2.95 4.68 4.14.65.28 1.16.44 1.56.56.65.21 1.24.18 1.71.11.52-.08 1.65-.67 1.88-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.18-.53-.32Z" />
            <path d="M16.02 3.2C8.95 3.2 3.2 8.94 3.2 16c0 2.49.72 4.92 2.08 7L3 29l6.16-2.2a12.8 12.8 0 0 0 6.86 1.99h.01c7.06 0 12.8-5.75 12.8-12.81 0-3.42-1.33-6.63-3.76-9.04A12.72 12.72 0 0 0 16.02 3.2Zm0 23.29h-.01a10.64 10.64 0 0 1-5.42-1.49l-.39-.23-3.66 1.31 1.34-3.57-.25-.37A10.57 10.57 0 0 1 5.38 16c0-5.87 4.77-10.64 10.64-10.64 2.84 0 5.51 1.1 7.52 3.11A10.56 10.56 0 0 1 26.65 16c0 5.87-4.77 10.64-10.63 10.64Z" />
          </svg>
        </span>

        <span className="hidden min-w-[190px] items-center gap-3 rounded-2xl px-5 py-4 sm:inline-flex">
          <svg
            viewBox="0 0 32 32"
            className="h-6 w-6 fill-current"
            aria-hidden="true"
          >
            <path d="M19.11 17.21c-.28-.14-1.65-.82-1.91-.91-.25-.09-.44-.14-.62.14-.18.28-.71.91-.87 1.1-.16.18-.32.21-.6.07-.28-.14-1.16-.43-2.21-1.38-.81-.72-1.36-1.61-1.52-1.89-.16-.28-.02-.43.12-.57.13-.13.28-.32.41-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.5-.07-.14-.62-1.49-.85-2.04-.22-.52-.45-.45-.62-.45h-.53c-.18 0-.46.07-.71.35-.25.28-.96.94-.96 2.29 0 1.35.98 2.66 1.12 2.84.14.18 1.93 2.95 4.68 4.14.65.28 1.16.44 1.56.56.65.21 1.24.18 1.71.11.52-.08 1.65-.67 1.88-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.18-.53-.32Z" />
            <path d="M16.02 3.2C8.95 3.2 3.2 8.94 3.2 16c0 2.49.72 4.92 2.08 7L3 29l6.16-2.2a12.8 12.8 0 0 0 6.86 1.99h.01c7.06 0 12.8-5.75 12.8-12.81 0-3.42-1.33-6.63-3.76-9.04A12.72 12.72 0 0 0 16.02 3.2Zm0 23.29h-.01a10.64 10.64 0 0 1-5.42-1.49l-.39-.23-3.66 1.31 1.34-3.57-.25-.37A10.57 10.57 0 0 1 5.38 16c0-5.87 4.77-10.64 10.64-10.64 2.84 0 5.51 1.1 7.52 3.11A10.56 10.56 0 0 1 26.65 16c0 5.87-4.77 10.64-10.63 10.64Z" />
          </svg>

          <span className="text-left">
            <span className="block text-sm font-bold leading-4">
              Falar no WhatsApp
            </span>
            <span className="mt-1 block text-[11px] leading-4 text-green-100">
              Atendimento rápido
            </span>
          </span>
        </span>
      </a>
    </div>
  );
}