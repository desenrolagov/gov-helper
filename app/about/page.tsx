export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20 sm:p-8">
          <div className="inline-flex items-center rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
            Quem somos
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
            DesenrolaGov
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
            A DesenrolaGov é uma assessoria privada criada para ajudar pessoas a
            organizarem solicitações documentais com mais clareza, orientação e
            acompanhamento durante o processo.
          </p>

          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
            <strong>Importante:</strong> a DesenrolaGov não é órgão público, não
            representa o governo e não possui vínculo com a Receita Federal ou
            qualquer repartição pública.
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <h2 className="text-lg font-black text-slate-950">
              Economia de tempo
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O cliente evita perder tempo tentando entender sozinho cada etapa.
              A plataforma organiza o caminho: contratação, pagamento, envio de
              documentos e acompanhamento.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <h2 className="text-lg font-black text-slate-950">
              Menos dúvidas no processo
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Cada atendimento segue uma sequência clara, com instruções por
              etapa. Isso reduz erros no envio de informações e documentos.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <h2 className="text-lg font-black text-slate-950">
              Atendimento mais organizado
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O pedido fica centralizado em uma área do cliente, facilitando o
              acompanhamento do status, dos documentos enviados e do resultado
              final quando liberado.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl sm:p-8">
          <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            Por que contratar uma assessoria?
          </div>

          <h2 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">
            Você ganha clareza, direção e acompanhamento
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-950">✔ Fluxo guiado</p>
              <p className="mt-1 text-sm text-slate-600">
                O cliente sabe qual é a próxima etapa e o que precisa fazer.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-950">✔ Documentos organizados</p>
              <p className="mt-1 text-sm text-slate-600">
                Os arquivos ficam vinculados ao pedido, evitando perda de
                informação.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-950">✔ Acompanhamento</p>
              <p className="mt-1 text-sm text-slate-600">
                O cliente consegue acompanhar o andamento pela própria área do
                cliente.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-bold text-slate-950">✔ Mais praticidade</p>
              <p className="mt-1 text-sm text-slate-600">
                Em vez de tentar resolver sozinho, o cliente segue um processo
                mais simples e direto.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            A DesenrolaGov não garante aprovação, prazo de conclusão ou decisão
            de órgãos públicos. O papel da assessoria é orientar, organizar e
            acompanhar o atendimento conforme as informações fornecidas pelo
            cliente.
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 text-center shadow-xl shadow-black/20 sm:p-8">
          <h2 className="text-2xl font-black text-white">
            Quer iniciar seu atendimento?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
            Escolha o serviço, siga as etapas e acompanhe tudo pela plataforma.
          </p>

          <a
            href="/services"
            className="mt-6 inline-flex rounded-2xl bg-[var(--accent-green)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
          >
            Ver serviços disponíveis
          </a>
        </section>
      </div>
    </main>
  );
}