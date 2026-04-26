import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--primary-blue)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
            DesenrolaGov
          </div>

          <h3 className="mt-4 text-2xl font-black leading-tight">
            Assessoria privada para regularização documental
          </h3>

          <p className="mt-4 text-sm leading-7 text-white/70">
            Organização da contratação, pagamento, envio de documentos e
            acompanhamento do pedido em um só lugar.
          </p>

          <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
            Não somos órgão público e não temos vínculo com a Receita Federal ou
            outros órgãos do governo.
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.25em] text-white/60">
            Navegação
          </h4>

          <div className="mt-5 space-y-3 text-sm text-white/75">
            <Link href="/" className="block hover:text-white">
              Início
            </Link>
            <Link href="/services" className="block hover:text-white">
              Serviços
            </Link>
            <Link href="/orders" className="block hover:text-white">
              Meus pedidos
            </Link>
            <Link href="/support" className="block hover:text-white">
              Suporte
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.25em] text-white/60">
            Institucional
          </h4>

          <div className="mt-5 space-y-3 text-sm text-white/75">
            <Link href="/about" className="block hover:text-white">
              Quem somos
            </Link>
            <Link href="/terms" className="block hover:text-white">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="block hover:text-white">
              Política de Privacidade
            </Link>
            <Link href="/support" className="block hover:text-white">
              Central de suporte
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black uppercase tracking-[0.25em] text-white/60">
            Confiança
          </h4>

          <div className="mt-5 space-y-4 text-sm leading-7 text-white/70">
            <p>Atendimento com fluxo organizado e suporte por etapa.</p>
            <p>Pagamento via Pix com confirmação rápida.</p>
            <p>Documentos usados apenas para execução do serviço contratado.</p>
          </div>

          <div className="mt-5">
            <SocialLinks />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} DesenrolaGov. Todos os direitos
        reservados.
      </div>
    </footer>
  );
}