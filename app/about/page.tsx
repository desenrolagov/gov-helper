export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Quem somos
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            DesenrolaGov
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            A DesenrolaGov é uma assessoria privada criada para organizar o fluxo
            de atendimento de serviços documentais com mais clareza, segurança e
            acompanhamento para o cliente.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <strong>Importante:</strong> não somos um órgão do governo e não
            possuímos vínculo com a Receita Federal ou qualquer repartição
            pública.
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Nossa proposta
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Tornar o atendimento mais claro, previsível e organizado, reduzindo
              dúvidas durante contratação, pagamento, envio de documentos e
              acompanhamento do pedido.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Como atuamos
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Atuamos como assessoria privada, com apoio operacional e orientação
              ao cliente dentro da plataforma, sempre de acordo com a etapa do
              serviço contratado.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              O que você encontra aqui
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Fluxo organizado, área do cliente, acompanhamento do pedido,
              centralização de documentos e suporte por etapa do atendimento.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}