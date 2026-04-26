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
  highlights?: unknown;
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

function normalizeHighlights(input: unknown) {
  if (!Array.isArray(input)) {
    return [
      "Atendimento privado completo",
      "Acompanhamento do início ao fim",
      "Processo simples e organizado",
    ];
  }

  const values = input
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .slice(0, 3);

  if (!values.length) {
    return [
      "Atendimento privado completo",
      "Acompanhamento do início ao fim",
      "Processo simples e organizado",
    ];
  }

  return values;
}

export default async function HomePage() {
  const user = await getCurrentUser();

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    take: 12,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      highlights: true,
    },
  });

  const featuredService =
    services.find((service: Service) => isCpfService(service.name)) ||
    services[0] ||
    null;

  const secondaryServices = services.filter(
    (service: Service) => service.id !== featuredService?.id
  );

  const primaryHref = featuredService
    ? `/continue?serviceId=${featuredService.id}`
    : "/services";

  const featuredHighlights = normalizeHighlights(featuredService?.highlights);

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
                Resolva seu documento com atendimento rápido e seguro
              </h1>

              <ul className="mt-5 max-w-md space-y-2 text-base leading-7 text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Cadastro simples e rápido</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Pagamento 100% seguro</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>Envio de documentos após contratação</span>
                </li>
              </ul>

              <div className="mt-5 max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                A DesenrolaGov é uma assessoria privada e não possui vínculo com
                órgãos públicos.
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-400"
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
                Rápido • Seguro • Sem burocracia
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_16px_50px_rgba(2,6,23,0.24)] sm:p-8">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-500">
                  Serviço em destaque
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Online
                </div>
              </div>

              {featuredService ? (
                <>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    {featuredService.name}
                  </h2>

                  <ul className="mt-3 max-w-md space-y-2 text-sm leading-6 text-slate-600">
                    {featuredHighlights.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <div className="text-[11px] font-semibold uppercase text-slate-500">
                        Valor
                      </div>
                      <div className="mt-1 text-4xl font-black text-slate-950">
                        {formatCurrency(Number(featuredService.price))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-5">
                      <div className="text-[11px] font-semibold uppercase text-slate-500">
                        Etapas
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>• Cadastro</li>
                        <li>• Pagamento</li>
                        <li>• Envio de documentos</li>
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={primaryHref}
                    className="mt-6 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Continuar agora
                  </Link>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border bg-slate-50 p-5 text-sm text-slate-600">
                  Nenhum serviço disponível.
                </div>
              )}
            </div>
          </div>

          {secondaryServices.length > 0 && (
            <div className="mt-10">
              <h3 className="text-xl font-bold text-white">Outros serviços</h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {secondaryServices.map((service: Service) => {
                  const serviceHighlights = normalizeHighlights(
                    service.highlights
                  );

                  return (
                    <div
                      key={service.id}
                      className="rounded-[24px] bg-white p-5 text-slate-900 shadow"
                    >
                      <h4 className="text-lg font-black">{service.name}</h4>

                      <ul className="mt-3 max-w-md space-y-2 text-sm leading-6 text-slate-600">
                        {serviceHighlights.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>

                      <div className="mt-4 text-3xl font-black">
                        {formatCurrency(Number(service.price))}
                      </div>

                      <Link
                        href={`/continue?serviceId=${service.id}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                      >
                        Iniciar agora
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
       </div>
      </section>
    </main>
  );
}