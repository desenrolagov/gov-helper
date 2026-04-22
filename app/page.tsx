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

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.06),transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Assessoria privada para regularização de CPF
              </div>

              <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl">
                Regularize seu CPF com suporte privado e pagamento seguro
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Atendimento 100% online para quem quer resolver rápido, com
                orientação clara, pagamento protegido e acompanhamento por etapa.
              </p>

              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Atenção: a DesenrolaGov é uma assessoria privada e não possui
                vínculo com a Receita Federal ou outros órgãos do governo.
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  {featuredService
                    ? "Regularizar meu CPF agora"
                    : "Ver serviço disponível"}
                </Link>

                <Link
                  href={user ? "/orders" : "/login"}
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {user ? "Ver meus pedidos" : "Já tenho conta"}
                </Link>
              </div>

              <div className="mt-3 text-xs text-slate-500 sm:text-sm">
                Cadastro rápido • pagamento seguro • envio de documentos depois
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    Fluxo mais rápido
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Sem precisar passar pelo catálogo no tráfego pago.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    Pagamento seguro
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Checkout protegido e separado da operação interna.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">
                    Atendimento organizado
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Pedido, documentos e andamento em um só lugar.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-500">
                  Serviço principal
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Atendimento online
                </div>
              </div>

              {featuredService ? (
                <>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                    {featuredService.name}
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {featuredService.description ||
                      "Atendimento privado com orientação, organização do pedido e acompanhamento do início ao fim."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Valor do atendimento
                      </div>
                      <div className="mt-1 text-4xl font-black text-slate-950">
                        {formatCurrency(Number(featuredService.price))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Indicado para
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>• CPF pendente de regularização</li>
                        <li>• Dificuldade com cadastro na Receita</li>
                        <li>• Quem quer resolver com suporte</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        1. Continue o atendimento
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Você entra direto na etapa de confirmação e cadastro rápido.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        2. Faça o pagamento
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        O checkout é liberado sem desviar do funil.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        3. Envie seus documentos
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        Depois do pagamento, o pedido segue para upload e
                        acompanhamento.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={primaryHref}
                    className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Continuar agora
                  </Link>

                  <div className="mt-3 text-center text-xs text-slate-500">
                    Você começa agora e segue em poucos passos.
                  </div>
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