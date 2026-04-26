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

  return values.length
    ? values
    : [
        "Atendimento privado completo",
        "Acompanhamento do início ao fim",
        "Processo simples e organizado",
      ];
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
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      {user ? <AppNav user={user} /> : null}

      <main>
        <section className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,220,120,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_35%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <section>
              <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
                Assessoria privada para regularização documental
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Resolva seu documento com atendimento rápido, seguro e
                organizado
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
                A DesenrolaGov organiza sua contratação, pagamento, envio de
                documentos e acompanhamento do pedido em uma plataforma simples.
              </p>

              <div className="mt-6 grid gap-3 text-sm font-semibold text-white/90 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  ✔ Cadastro rápido
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  ✔ Pagamento via Pix
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  ✔ Acompanhamento online
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
                A DesenrolaGov é uma assessoria privada e não possui vínculo com
                a Receita Federal, gov.br ou qualquer órgão público.
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent-green)] px-6 py-4 text-sm font-black text-white shadow-xl shadow-green-950/20 hover:bg-[var(--accent-green-hover)]"
                >
                  {featuredService
                    ? `Iniciar ${featuredService.name}`
                    : "Iniciar atendimento"}
                </Link>

                <Link
                  href={user ? "/orders" : "/login"}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white hover:bg-white/15"
                >
                  {user ? "Ver meus pedidos" : "Já tenho conta"}
                </Link>
              </div>

              <p className="mt-3 text-xs font-semibold text-white/60">
                Rápido • Seguro • Sem burocracia desnecessária
              </p>
            </section>

            <aside className="rounded-[2rem] bg-white p-6 text-[var(--text-dark)] shadow-2xl sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-500">
                  Serviço em destaque
                </p>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  Online
                </span>
              </div>

              {featuredService ? (
                <>
                  <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                    {featuredService.name}
                  </h2>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    {featuredHighlights.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Valor
                      </p>
                      <p className="mt-2 text-3xl font-black text-slate-950">
                        {formatCurrency(Number(featuredService.price))}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Etapas
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        <li>• Cadastro</li>
                        <li>• Pagamento</li>
                        <li>• Envio de documentos</li>
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={`/continue?serviceId=${featuredService.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white hover:bg-slate-800"
                  >
                    Continuar agora
                  </Link>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Pagamento via Pix com confirmação rápida.
                  </p>
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  Nenhum serviço disponível no momento.
                </div>
              )}
            </aside>
          </div>
        </section>

        <section className="bg-white px-4 py-12 text-[var(--text-dark)] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  1. Escolha o serviço
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Comece em poucos cliques
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Selecione o atendimento desejado e avance para a próxima etapa.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  2. Faça o pagamento
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Pix e confirmação rápida
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Após a confirmação válida, o sistema libera a etapa de envio.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  3. Acompanhe tudo
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Pedido organizado
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Documentos, status e resultado ficam centralizados na sua área.
                </p>
              </div>
            </div>
          </div>
        </section>

        {secondaryServices.length > 0 ? (
          <section className="px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6">
                <p className="text-sm font-bold text-green-300">
                  Outros serviços
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Mais opções disponíveis
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {secondaryServices.map((service: Service) => {
                  const serviceHighlights = normalizeHighlights(
                    service.highlights
                  );

                  return (
                    <div
                      key={service.id}
                      className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl"
                    >
                      <h3 className="text-xl font-black text-slate-950">
                        {service.name}
                      </h3>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        {serviceHighlights.map((item) => (
                          <p key={item}>• {item}</p>
                        ))}
                      </div>

                      <div className="mt-5 text-2xl font-black text-slate-950">
                        {formatCurrency(Number(service.price))}
                      </div>

                      <Link
                        href={`/continue?serviceId=${service.id}`}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent-green)] px-5 py-3 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
                      >
                        Iniciar agora
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}