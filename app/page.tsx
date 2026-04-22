import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";

export const dynamic = "force-dynamic";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

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
    take: 12,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
    },
  });

  const featuredService =
    services.find((service) => isCpfService(service.name)) || services[0] || null;

  const secondaryServices = services.filter(
    (service) => service.id !== featuredService?.id
  );

  const primaryHref = featuredService
    ? `/continue?serviceId=${featuredService.id}`
    : "/services";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {user ? <AppNav user={user} /> : null}

      <section className="relative overflow-hidden bg-[#041f4a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.10),transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Assessoria privada para regularização documental
              </div>

              <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Resolva seu documento com atendimento privado, rápido e seguro
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                Escolha o serviço, siga para o cadastro rápido e avance para o
                pagamento em poucos passos.
              </p>

              <ul className="mt-6 space-y-3 text-base text-white/95">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-400">✔</span>
                  <span>Fluxo direto sem etapas desnecessárias.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-400">✔</span>
                  <span>Pagamento seguro e atendimento organizado por etapa.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-emerald-400">✔</span>
                  <span>Envio de documentos apenas depois da contratação.</span>
                </li>
              </ul>

              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100">
                Atenção: a DesenrolaGov é uma assessoria privada e não possui
                vínculo com a Receita Federal ou outros órgãos do governo.
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  {featuredService
                    ? `INICIAR ${featuredService.name.toUpperCase()}`
                    : "INICIAR AGORA"}
                </Link>

                <Link
                  href={user ? "/orders" : "/login"}
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  {user ? "Ver meus pedidos" : "Já tenho conta"}
                </Link>
              </div>

              <div className="mt-3 text-sm text-slate-300">
                Cadastro rápido • pagamento seguro • fluxo organizado
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_16px_50px_rgba(2,6,23,0.24)] sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-500">
                  Serviço em destaque
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
                        Como funciona
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>• Cadastro rápido</li>
                        <li>• Pagamento seguro</li>
                        <li>• Envio de documentos depois</li>
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={primaryHref}
                    className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Continuar agora
                  </Link>

                  <div className="mt-3 text-center text-xs text-slate-500">
                    Você começa agora e segue em poucos passos.
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Nenhum serviço ativo disponível no momento.
                </div>
              )}
            </div>
          </div>

          {secondaryServices.length > 0 ? (
            <div className="mt-8 sm:mt-10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Outros serviços disponíveis
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Escolha a opção que deseja iniciar agora.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {secondaryServices.map((service: Service) => (
                  <div
                    key={service.id}
                    className="rounded-[24px] border border-white/10 bg-white p-5 text-slate-900 shadow-[0_10px_30px_rgba(2,6,23,0.18)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-lg font-black leading-tight text-slate-950">
                        {service.name}
                      </h4>
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Online
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {service.description ||
                        "Atendimento privado com fluxo simples, pagamento seguro e acompanhamento por etapa."}
                    </p>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Valor
                      </div>
                      <div className="mt-1 text-3xl font-black text-slate-950">
                        {formatCurrency(Number(service.price))}
                      </div>
                    </div>

                    <Link
                      href={`/continue?serviceId=${service.id}`}
                      className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      Iniciar agora
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}