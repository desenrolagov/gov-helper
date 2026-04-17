import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold text-slate-900">DesenrolaGov</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Plataforma de atendimento com fluxo organizado para contratação,
              pagamento, envio de documentos, acompanhamento do pedido e entrega
              final do serviço.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mensagem institucional
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                O atendimento é realizado conforme a etapa operacional de cada
                pedido. Em caso de dúvida, utilize os canais oficiais de
                suporte informados na plataforma.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Acesso rápido</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Início
              </Link>
              <Link href="/services" className="hover:text-slate-900">
                Serviços
              </Link>
              <Link href="/orders" className="hover:text-slate-900">
                Meus pedidos
              </Link>
              <Link href="/support" className="hover:text-slate-900">
                Suporte
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Informações legais</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-slate-900">
                Política de Privacidade
              </Link>
              <Link href="/terms" className="hover:text-slate-900">
                Termos de Uso
              </Link>
              <Link href="/support" className="hover:text-slate-900">
                Central de Suporte
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DesenrolaGov. Todos os direitos reservados.</p>
          <p>Atendimento sujeito à análise operacional e documental.</p>
        </div>
      </div>
    </footer>
  );
}