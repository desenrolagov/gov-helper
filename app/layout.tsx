import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export const metadata: Metadata = {
  title: "DesenrolaGov",
  description:
    "Assessoria privada para contratação de serviços documentais, pagamento, envio de documentos e acompanhamento do atendimento.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>

        <WhatsAppFloatingButton />
      </body>
    </html>
  );
}