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

  return (
    <div className="min-h-screen bg-slate-50">
      {user ? <AppNav user={user} /> : null}

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Plataforma com acompanhamento profissional
                </div>

                <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Solicite seu serviço com mais clareza, segurança e
                  acompanhamento em cada etapa
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Centralize seu atendimento em uma área do cliente moderna:
                  escolha o serviço, envie seus documentos, acompanhe o status
                  do pedido e receba tudo com mais praticidade.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={user ? "/services" : "/register"}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {user ? "Solicitar novo serviço" : "Criar conta e começar"}
                  </Link>

                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver serviços disponíveis
                  </Link>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">1</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Pedido simples
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Solicite o serviço em poucos passos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">2</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Upload organizado
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Envie documentos vinculados ao pedido.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-2xl font-bold text-slate-900">3</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Acompanhamento real
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Veja o status até a conclusão.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:pl-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Área do cliente
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-900">
                        Fluxo simples e visual
                      </h2>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Atendimento ativo
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700">
                          1
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Escolha o serviço
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Veja os serviços disponíveis e selecione a opção
                            ideal para sua necessidade.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700">
                          2
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Pague e envie documentos
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Finalize a etapa de pagamento e mantenha seus
                            arquivos organizados dentro do pedido.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
                          3
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Acompanhe o andamento
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Consulte status, arquivos enviados e próximas ações
                            em uma experiência mais profissional.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      O que você ganha
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Processo mais claro
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Etapas bem definidas
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Documentos centralizados
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        Acompanhamento do pedido
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
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-xl">
                🔒
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Mais segurança no processo
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seus pedidos, documentos e etapas ficam organizados em uma área
                do cliente mais clara e confiável.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                ⚡
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Atendimento mais ágil
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Com pagamento, envio de documentos e acompanhamento no mesmo
                fluxo, o atendimento ganha velocidade e fluidez.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl">
                📈
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Visão clara do andamento
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Saiba em qual etapa seu pedido está e o que precisa ser feito a
                seguir, sem depender de mensagens soltas.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Serviços em destaque
              </p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Escolha o serviço ideal para começar
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Veja algumas opções disponíveis e inicie seu atendimento com mais
                praticidade.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Serviço disponível
                    </span>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Ativo
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">
                    {service.name}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                    {service.description}
                  </p>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Valor
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatCurrency(service.price)}
                      </p>
                    </div>

                    <Link
                      href="/services"
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Solicitar
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Como funciona
                </p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  Um fluxo simples, visual e mais profissional
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
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
                    Consulte os serviços disponíveis e inicie sua solicitação.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    02. Crie seu pedido
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Tenha o pedido registrado com valor, status e identificação.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    03. Envie documentos
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Organize os arquivos no próprio pedido para acelerar o
                    atendimento.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">
                    04. Acompanhe o status
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Veja o andamento e a próxima ação até a conclusão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-blue-300">
                  Pronto para começar?
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Entre na área do cliente e acompanhe tudo em um só lugar
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Solicite serviços, envie arquivos, acompanhe etapas e tenha
                  mais clareza em todo o processo.
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