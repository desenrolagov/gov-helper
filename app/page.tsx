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

function isCpfService(name?: string | null) {
  return (name || "").toLowerCase().includes("cpf");
}

export default async function HomePage() {
  const user = await getCurrentUser();

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
  });

  const featuredService =
    services.find((service) => isCpfService(service.name)) || services[0] || null;

  const primaryHref = featuredService
    ? `/continue?serviceId=${featuredService.id}`
    : "/services";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {user ? <AppNav user={user} /> : null}

      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Assessoria privada para regularização de CPF
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Regularize seu CPF com suporte privado e pagamento seguro
              </h1>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                Entre, siga para a próxima etapa e conclua sua solicitação com um
                fluxo simples: pedido, pagamento, envio de documentos e
                acompanhamento.
              </p>

              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Atenção: a DesenrolaGov é uma assessoria privada e não possui
                vínculo com a Receita Federal ou outros órgãos do governo.
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {featuredService
                    ? "Regularizar meu CPF agora"
                    : "Ver serviço disponível"}
                </Link>

                <Link
                  href={user ? "/orders" : "/login"}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {user ? "Ver meus pedidos" : "Já tenho conta"}
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-slate-900">
                    Fluxo mais rápido
                  </div>
                  <p className="mt-1">
                    Sem precisar passar pelo catálogo no tráfego pago.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-slate-900">
                    Pagamento seguro
                  </div>
                  <p className="mt-1">
                    Checkout protegido e separado da operação interna.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-slate-900">
                    Acompanhamento real
                  </div>
                  <p className="mt-1">
                    Pedido, documentos e andamento em um só lugar.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="text-sm font-semibold text-slate-500">
                Serviço principal
              </div>

              {featuredService ? (
                <>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {featuredService.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {featuredService.description ||
                      "Atendimento privado com orientação, organização do pedido e acompanhamento do início ao fim."}
                  </p>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Valor do atendimento
                    </div>
                    <div className="mt-1 text-3xl font-black text-slate-950">
                      {formatCurrency(Number(featuredService.price))}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-sm text-slate-700">
                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                      <span className="mt-0.5 text-slate-900">1.</span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          Continue o atendimento
                        </div>
                        <p className="mt-1 text-slate-600">
                          Você entra direto na etapa de confirmação.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                      <span className="mt-0.5 text-slate-900">2.</span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          Faça o pagamento
                        </div>
                        <p className="mt-1 text-slate-600">
                          O checkout é liberado sem desviar do funil.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                      <span className="mt-0.5 text-slate-900">3.</span>
                      <div>
                        <div className="font-semibold text-slate-900">
                          Envie seus documentos
                        </div>
                        <p className="mt-1 text-slate-600">
                          Depois do pagamento, o pedido segue para upload e
                          acompanhamento.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={primaryHref}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Continuar agora
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Serviço indisponível no momento
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    No momento não há um serviço ativo para iniciar direto por
                    esta página.
                  </p>
                  <Link
                    href="/services"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver serviços disponíveis
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}