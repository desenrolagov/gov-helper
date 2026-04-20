import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <div>
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              DesenrolaGov
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Assessoria privada para regularização documental
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              A DesenrolaGov é uma assessoria privada que organiza a contratação,
              o pagamento, o envio de documentos e o acompanhamento do pedido em
              um só lugar.
            </p>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>Atenção:</strong> não somos um órgão público e não temos
              vínculo com a Receita Federal ou outros órgãos do governo.
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Navegação
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link href="/" className="text-slate-700 transition hover:text-slate-900">
                Início
              </Link>
              <Link
                href="/services"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Serviços
              </Link>
              <Link
                href="/orders"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Meus pedidos
              </Link>
              <Link
                href="/support"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Suporte
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Institucional
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link
                href="/about"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Quem somos
              </Link>
              <Link
                href="/terms"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacy"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/support"
                className="text-slate-700 transition hover:text-slate-900"
              >
                Central de suporte
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Confiança e atendimento
            </h3>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                Atendimento com fluxo organizado, acompanhamento do pedido e
                suporte por etapa.
              </p>
              <p>
                O andamento do serviço depende da análise documental, da etapa
                operacional e da validação do pagamento.
              </p>
              <p>
                Os documentos enviados são usados apenas para execução do serviço
                contratado e rotinas operacionais da plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-500">
          <p>© 2026 DesenrolaGov. Todos os direitos reservados.</p>
          <p className="mt-1">
            Plataforma de assessoria privada para atendimento documental e
            organização do fluxo do cliente.
          </p>
        </div>
      </div>
    </footer>
  );
}