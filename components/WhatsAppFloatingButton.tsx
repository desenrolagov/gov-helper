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

  if (pathname.startsWith("/continue")) {
    return "Olá! Preciso de ajuda para continuar meu atendimento na DesenrolaGov.";
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
      text: "Tire dúvidas antes de contratar.",
    };
  }

  if (pathname.startsWith("/continue")) {
    return {
      title: "Precisa de ajuda?",
      text: "Fale conosco sem sair do atendimento.",
    };
  }

  if (pathname.startsWith("/support")) {
    return {
      title: "Suporte rápido",
      text: "Fale com nosso atendimento no WhatsApp.",
    };
  }

  if (pathname.startsWith("/orders/")) {
    return {
      title: "Ajuda com seu pedido",
      text: "Tire dúvidas sobre andamento e próximas etapas.",
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
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {showBubble ? (
        <div className="hidden max-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:block">
          <p className="text-sm font-black">{bubbleCopy.title}</p>
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
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-green)] text-white shadow-2xl shadow-green-950/30 transition hover:scale-105 hover:bg-[var(--accent-green-hover)] sm:h-auto sm:w-auto sm:gap-3 sm:px-5 sm:py-4"
      >
        <span className="text-2xl leading-none">☘</span>

        <span className="hidden text-left sm:block">
          <span className="block text-sm font-black">Falar no WhatsApp</span>
          <span className="block text-xs font-semibold text-white/80">
            Atendimento rápido
          </span>
        </span>
      </a>
    </div>
  );
}