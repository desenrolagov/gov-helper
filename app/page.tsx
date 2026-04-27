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

          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <section>
              <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
                Atendimento privado, rápido e 100% online
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Regularize seu CPF sem sair de casa
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/75">
                Evite bloqueios no banco, dificuldades com emprego,
                financiamentos e cadastros. A DesenrolaGov organiza seu
                atendimento do início ao fim, sem filas e sem burocracia.
              </p>

              <div className="mt-6 grid gap-3 text-sm font-semibold text-white/90 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  ✔ Cadastro rápido
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  ✔ Pagamento seguro
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  ✔ Suporte online
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={primaryHref}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent-green)] px-6 py-4 text-base font-black text-white shadow-lg shadow-green-900/30 transition hover:scale-[1.02] hover:bg-[var(--accent-green-hover)] sm:w-auto"
                >
                  Regularizar meu CPF agora
                </Link>

                <Link
                  href={user ? "/orders" : "/login"}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  {user ? "Acompanhar pedido" : "Já tenho atendimento"}
                </Link>
              </div>

              <p className="mt-3 text-xs text-white/60">
                Leva menos de 2 minutos para iniciar.
              </p>

              <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-100">
                A DesenrolaGov é uma assessoria privada e não possui vínculo com
                a Receita Federal, gov.br ou qualquer órgão público.
              </div>
            </section>

            <aside className="rounded-[2rem] bg-white p-6 text-[var(--text-dark)] shadow-2xl sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-500">
                  Serviço principal
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

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Cuidamos do processo para você de forma simples, organizada
                    e com acompanhamento online.
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    {featuredHighlights.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Valor do atendimento
                    </p>
                    <p className="mt-2 text-4xl font-black text-slate-950">
                      {formatCurrency(Number(featuredService.price))}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Pagamento via Pix com confirmação rápida.
                    </p>
                  </div>

                  <Link
                    href={`/continue?serviceId=${featuredService.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white hover:bg-slate-800"
                  >
                    Começar meu atendimento
                  </Link>

                  <p className="mt-3 text-center text-xs text-slate-500">
                    Atendimento privado, seguro e sem vínculo com o governo.
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
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--accent-green)]">
                CPF irregular pode atrapalhar sua vida
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Resolva antes que vire um problema maior
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                "Dificuldade para abrir conta",
                "Problemas em financiamentos",
                "Bloqueios em cadastros",
                "Dúvidas com documentos",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center font-bold text-slate-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 pb-12 text-[var(--text-dark)] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  1. Preencha seus dados
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Comece em poucos cliques
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Você informa os dados necessários para iniciar seu atendimento.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  2. Faça o pagamento
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Pix com confirmação rápida
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Após a confirmação, liberamos a próxima etapa do processo.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-bold text-[var(--accent-green)]">
                  3. Acompanhe online
                </p>
                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Tudo em um só lugar
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Você acompanha documentos, status e retorno pela plataforma.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 pb-12 text-[var(--text-dark)] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--accent-green)]">
                Avaliações de clientes
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                Atendimento simples, organizado e acompanhado
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                [
                  "Maria S.",
                  "Consegui entender o passo a passo e acompanhar tudo pela plataforma.",
                ],
                [
                  "João P.",
                  "Gostei porque o atendimento ficou organizado e sem confusão.",
                ],
                [
                  "Ana R.",
                  "Foi prático enviar os documentos e acompanhar o andamento.",
                ],
              ].map(([name, text]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="font-black text-slate-950">{name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    “{text}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-black sm:text-4xl">
              Comece agora seu atendimento
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/70">
              Regularize sua situação com suporte privado, atendimento online e
              processo organizado.
            </p>

            <Link
              href={primaryHref}
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent-green)] px-6 py-4 text-base font-black text-white shadow-lg shadow-green-900/30 transition hover:scale-[1.02] hover:bg-[var(--accent-green-hover)] sm:w-auto"
            >
              Regularizar meu CPF agora
            </Link>

            <p className="mt-4 text-xs text-white/50">
              A DesenrolaGov é uma assessoria privada e não possui vínculo com
              órgãos públicos.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}