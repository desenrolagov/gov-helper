import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1fr] lg:px-8">
        <div>
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            DesenrolaGov
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            Assessoria privada para regularização documental
          </h3>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            A DesenrolaGov é uma assessoria privada que organiza a contratação,
            o pagamento, o envio de documentos e o acompanhamento do pedido em
            um só lugar.
          </p>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Atenção: não somos um órgão público e não temos vínculo com a
            Receita Federal ou outros órgãos do governo.
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900">
              Acompanhe a DesenrolaGov
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Veja nossos canais oficiais e fale com a gente.
            </p>

            <SocialLinks className="mt-4" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Navegação
          </h4>

          <div className="mt-4 flex flex-col gap-3">
            <Link href="/" className="text-sm text-slate-700 transition hover:text-slate-900">
              Início
            </Link>
            <Link href="/services" className="text-sm text-slate-700 transition hover:text-slate-900">
              Serviços
            </Link>
            <Link href="/orders" className="text-sm text-slate-700 transition hover:text-slate-900">
              Meus pedidos
            </Link>
            <Link href="/support" className="text-sm text-slate-700 transition hover:text-slate-900">
              Suporte
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Institucional
          </h4>

          <div className="mt-4 flex flex-col gap-3">
            <Link href="/about" className="text-sm text-slate-700 transition hover:text-slate-900">
              Quem somos
            </Link>
            <Link href="/terms" className="text-sm text-slate-700 transition hover:text-slate-900">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="text-sm text-slate-700 transition hover:text-slate-900">
              Política de Privacidade
            </Link>
            <Link href="/support" className="text-sm text-slate-700 transition hover:text-slate-900">
              Central de suporte
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-500">
            Confiança e atendimento
          </h4>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Atendimento com fluxo organizado, acompanhamento do pedido e suporte
            por etapa.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            O andamento do serviço depende da análise documental, da etapa
            operacional e da validação do pagamento.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Os documentos enviados são usados apenas para execução do serviço
            contratado e rotinas operacionais da plataforma.
          </p>

          <SocialLinks textMode className="mt-5" />
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© 2026 DesenrolaGov. Todos os direitos reservados.</p>
          <p>Atendimento sujeito à análise operacional e documental.</p>
        </div>
      </div>
    </footer>
  );
}