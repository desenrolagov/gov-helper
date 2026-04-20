import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getServiceShortLabel(serviceName: string) {
  const name = serviceName.toLowerCase();

  if (name.includes("cpf")) {
    return "Serviço principal";
  }

  return "Atendimento disponível";
}

export default async function HomePage() {
  const user = await getCurrentUser();

  const services = await prisma.service.findMany({
    where: {
      active: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  const featuredService = services[0] || null;

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? <AppNav user={user} /> : null}

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
              <div>
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Assessoria privada para regularização de CPF
                </div>

                <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Regularize seu CPF com mais clareza, suporte e acompanhamento
                  em cada etapa
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  A DesenrolaGov organiza seu atendimento em um só lugar:
                  contratação, pagamento, envio de documentos e acompanhamento
                  do pedido com uma experiência mais clara e profissional.
                </p>

                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  <strong>Atenção:</strong> a DesenrolaGov é uma assessoria
                  privada e não possui vínculo com órgãos do governo.
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={user ? "/services" : "/register"}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
                  >
                    {user ? "Solicitar regularização" : "Criar conta e começar"}
                  </Link>

                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver serviço disponível
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">1</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Solicitação simples
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Comece o pedido em poucos passos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">2</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Documentos organizados
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Envie os arquivos no local certo.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">3</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Acompanhamento real
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Veja o andamento até a conclusão.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:pl-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        Fluxo organizado
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                        Uma jornada mais clara para regularização de CPF
                      </h2>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Atendimento ativo
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Contrate o serviço
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Inicie sua solicitação com uma estrutura simples e
                            organizada.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Faça o pagamento
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Confirme sua contratação em ambiente seguro.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Envie e acompanhe
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Organize documentos e acompanhe o andamento pelo seu
                            painel.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      O que você encontra aqui
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Pedido com acompanhamento
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Pagamento integrado
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Documentos centralizados
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Atendimento privado organizado
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl">
                🔒
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Mais organização
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seu pedido, seus arquivos e o andamento do serviço ficam
                centralizados em um único lugar.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                ⚡
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Mais clareza antes da contratação
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Veja valor, etapas, fluxo e próximos passos antes de seguir para
                o pagamento.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl">
                📈
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Acompanhamento do pedido
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Saiba em que etapa está sua solicitação e o que precisa ser feito
                em seguida.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Serviço em destaque
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Comece pela regularização do CPF
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Contrate com mais confiança, entenda a proposta e siga para um
                fluxo organizado.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver todos os serviços
            </Link>
          </div>

          {services.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  🛠️
                </div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Em breve novos serviços
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ainda não há serviços ativos para exibição nesta página.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const isFeatured = featuredService?.id === service.id;
                const isCpfService = service.name.toLowerCase().includes("cpf");

                return (
                  <article
                    key={service.id}
                    className={`flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 ${
                      isFeatured || isCpfService
                        ? "border-blue-200 ring-1 ring-blue-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isFeatured || isCpfService
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {getServiceShortLabel(service.name)}
                      </span>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Ativo
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900">
                      {service.name}
                    </h3>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="max-h-[220px] overflow-y-auto pr-1 text-sm leading-7 text-slate-600 whitespace-pre-line">
                        {service.description}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {formatCurrency(service.price)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Fluxo
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          Pedido, pagamento, envio e acompanhamento.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Indicado para
                      </p>

                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p>• Quem precisa resolver a situação cadastral</p>
                        <p>• Quem busca mais clareza no processo</p>
                        <p>• Quem quer acompanhamento em uma área do cliente</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      <Link
                        href="/services"
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
                      >
                        Solicitar serviço
                      </Link>

                      <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                        Antes do pagamento, você verá o pedido, o valor e a etapa
                        correta para continuar.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Como funciona
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Um fluxo mais simples para quem quer resolver o CPF
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  A plataforma foi pensada para reduzir dúvidas, organizar os
                  envios e deixar cada etapa do pedido mais clara para o
                  cliente.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    01. Escolha o serviço
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Selecione a opção de regularização e inicie sua solicitação.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    02. Crie seu pedido
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    O pedido fica registrado com valor, identificação e status.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    03. Faça o pagamento
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    O checkout confirma a compra e prepara a próxima etapa.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    04. Envie e acompanhe
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Organize os documentos e acompanhe o andamento até a
                    conclusão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-blue-300">
                  Pronto para começar?
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Entre na DesenrolaGov e acompanhe seu pedido em um só lugar
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Solicite a regularização do CPF, envie arquivos, acompanhe as
                  etapas e tenha mais clareza em todo o processo.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={user ? "/orders" : "/login"}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  {user ? "Ver meus pedidos" : "Entrar"}
                </Link>

                <Link
                  href={user ? "/services" : "/register"}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {user ? "Solicitar serviço" : "Criar conta"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}