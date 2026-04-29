import { getCurrentUser } from "@/lib/current-user";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import AdminOrderAuditTimeline from "@/components/admin/AdminOrderAuditTimeline";
import AdminFinalDeliveryCard from "@/components/admin/AdminFinalDeliveryCard";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function getStatusTimelineMeta(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        title: "Pedido criado",
        description: "O pedido foi iniciado e ficou aguardando pagamento.",
        tone: "amber" as const,
        badge: "Status",
      };

    case "PAID":
      return {
        title: "Pagamento aprovado",
        description: "O pagamento foi confirmado e o atendimento foi liberado.",
        tone: "green" as const,
        badge: "Pagamento",
      };

    case "AWAITING_DOCUMENTS":
      return {
        title: "Aguardando documentos",
        description: "O cliente precisa enviar os documentos obrigatórios.",
        tone: "amber" as const,
        badge: "Documentos",
      };

    case "WAITING_OPERATOR_SCHEDULE_REVIEW":
      return {
        title: "Aguardando unidade Poupatempo",
        description:
          "Documentos recebidos. O operador deve localizar a unidade e horários disponíveis.",
        tone: "blue" as const,
        badge: "Poupatempo",
      };

    case "PROCESSING":
      return {
        title: "Pedido em atendimento",
        description: "A equipe iniciou o andamento do pedido.",
        tone: "blue" as const,
        badge: "Status",
      };

    case "COMPLETED":
      return {
        title: "Pedido concluído",
        description: "O atendimento foi finalizado.",
        tone: "green" as const,
        badge: "Entrega",
      };

    case "CANCELLED":
      return {
        title: "Pedido cancelado",
        description: "O pedido foi encerrado sem conclusão.",
        tone: "red" as const,
        badge: "Status",
      };

    default:
      return {
        title: status,
        description: "Atualização registrada no pedido.",
        tone: "slate" as const,
        badge: "Status",
      };
  }
}

function OperatorScheduleReviewCard({ order }: { order: any }) {
  const isWaiting = order.status === "WAITING_OPERATOR_SCHEDULE_REVIEW";

  if (!isWaiting) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-slate-900 shadow-xl">
      <p className="text-xs font-black uppercase tracking-wide text-amber-700">
        Atenção do operador
      </p>

      <h2 className="mt-2 text-xl font-black text-slate-950">
        Localizar Poupatempo e horário
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        Este pedido já recebeu os documentos. Agora o operador deve verificar a
        unidade do Poupatempo mais próxima do cliente e informar o melhor horário
        disponível para foto e biometria.
      </p>
    </div>
  );
}

function MeiApplicationCard({ meiApplication }: { meiApplication: any }) {
  if (!meiApplication) return null;

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 text-slate-900 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            Formulário do cliente
          </p>
          <h2 className="mt-1 text-xl font-black">Dados para abertura do MEI</h2>
          <p className="mt-1 text-sm text-slate-500">
            Informações preenchidas pelo cliente após a confirmação do pagamento.
          </p>
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
          Recebido
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">Nome completo</p>
          <p className="mt-1 font-black">{meiApplication.fullName}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">CPF</p>
          <p className="mt-1 font-black">{meiApplication.cpf}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">Telefone / WhatsApp</p>
          <p className="mt-1 font-black">{meiApplication.phone}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">E-mail</p>
          <p className="mt-1 font-black">{meiApplication.email}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">Nascimento</p>
          <p className="mt-1 font-black">
            {meiApplication.birthDate
              ? formatDateOnly(meiApplication.birthDate)
              : "Não informado"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">Conta gov.br</p>
          <p className="mt-1 font-black">
            {meiApplication.hasGovBrAccount === true
              ? "Sim"
              : meiApplication.hasGovBrAccount === false
                ? "Não"
                : "Não informado"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-500">Endereço</p>
        <p className="mt-2 font-bold">
          {meiApplication.addressStreet || "Rua não informada"},{" "}
          {meiApplication.addressNumber || "S/N"}
        </p>
        <p className="text-sm text-slate-600">
          {meiApplication.addressDistrict || "Bairro não informado"} -{" "}
          {meiApplication.addressCity || "Cidade não informada"} /{" "}
          {meiApplication.addressState || "UF"}
        </p>
        <p className="text-sm text-slate-600">
          CEP: {meiApplication.addressZipCode || "Não informado"}
        </p>

        {meiApplication.addressComplement && (
          <p className="mt-1 text-sm text-slate-600">
            Complemento: {meiApplication.addressComplement}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700">Atividade desejada</p>
          <p className="mt-1 font-black text-slate-900">
            {meiApplication.businessActivity}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-xs font-bold text-blue-700">Nome fantasia</p>
          <p className="mt-1 font-black text-slate-900">
            {meiApplication.fantasyName || "Não informado"}
          </p>
        </div>
      </div>

      {meiApplication.notes && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">Observações</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {meiApplication.notes}
          </p>
        </div>
      )}
    </div>
  );
}

export default async function AdminOrderDetailsPage({ params }: any) {
  const session = await verifySession();
  const user = await getCurrentUser();

  if (!session || !user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

const order = await prisma.order.findUnique({
  where: { id },
  include: {
    user: true,
    service: true,
    uploadedFiles: { orderBy: { createdAt: "desc" } },
    resultFiles: { orderBy: { createdAt: "desc" } },
    payments: { orderBy: { createdAt: "desc" } },
    histories: { orderBy: { createdAt: "desc" } },
  },
});

const meiApplicationResult = await prisma.$queryRaw<any[]>`
  SELECT *
  FROM "MeiApplication"
  WHERE "orderId" = ${id}
  LIMIT 1
`;

const meiApplication = meiApplicationResult[0] || null;

  if (!order) {
    redirect("/admin/orders");
  }

const totalUploads = order.uploadedFiles.length;
const totalResults = order.resultFiles.length;
const paid = order.payments.some((p: any) => p.status === "PAID");

const serviceName = order.service.name.toLowerCase();
const orderCode = order.orderCode?.toLowerCase() || "";

const isMEI = serviceName.includes("mei") || orderCode.startsWith("mei");
const isRG = serviceName.includes("rg") || orderCode.startsWith("rg");
const isCPF = serviceName.includes("cpf") || orderCode.startsWith("cpf");

const timelineItems = order.histories.map((history: any) => {
  const meta = getStatusTimelineMeta(history.status);

  return {
    id: history.id,
    title: meta.title,
    description: meta.description,
    timestamp: formatDateTime(history.createdAt),
    sortDate: history.createdAt,
    tone: meta.tone,
    badge: meta.badge,
  };
});

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
                Painel administrativo
              </div>

              <h1 className="mt-3 text-2xl font-black">
                Pedido {order.orderCode || order.id.slice(0, 8)}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-white/70">
                  {order.user.name} ({order.user.email})
                </span>
              </div>

              <p className="mt-2 text-sm text-white/70">
                Serviço: {order.service.name}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/orders/${order.id}`}
                target="_blank"
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10"
              >
                Ver cliente
              </Link>

              <Link
                href="/admin/orders"
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10"
              >
                Voltar
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Valor</p>
            <p className="text-xl font-black">
              {formatCurrency(Number(order.totalAmount))}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Pagamento</p>
            <p className="text-xl font-black">
              {paid ? "Confirmado" : "Pendente"}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Uploads</p>
            <p className="text-xl font-black">{totalUploads}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
            <p className="text-xs text-slate-500">Resultados</p>
            <p className="text-xl font-black">{totalResults}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <OperatorScheduleReviewCard order={order} />

              <MeiApplicationCard meiApplication={meiApplication} />

            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
{isMEI ? (
  <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-slate-900 shadow-xl">
    <p className="text-xs font-black uppercase tracking-wide text-green-700">
      Fluxo MEI
    </p>

    <h2 className="mt-2 text-lg font-black">
      Sem upload de documentos pelo cliente
    </h2>

    <p className="mt-2 text-sm text-green-800">
      Para abertura de MEI, o cliente envia os dados pelo formulário. O próximo
      passo é o admin processar a abertura e enviar o certificado MEI na entrega
      final.
    </p>
  </div>
) : (
  <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
    <h2 className="text-lg font-black">Documentos do cliente</h2>

    {order.uploadedFiles.length === 0 ? (
      <p className="mt-3 text-sm text-slate-500">
        Nenhum documento enviado
      </p>
    ) : (
      <div className="mt-4 space-y-3">
        {order.uploadedFiles.map((file: any) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-4 rounded-2xl border p-3"
          >
            <div className="min-w-0">
              <p className="break-all text-sm font-bold">
                {file.originalName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tipo: {file.type || "Documento"}
              </p>
            </div>

            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-sm font-bold text-[var(--accent-green)]"
            >
              Abrir
            </a>
          </div>
        ))}
      </div>
    )}
  </div>
)}

              <Link
                href={`/admin/orders/${order.id}/upload-result`}
                className="mt-4 inline-flex rounded-2xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white"
              >
                Enviar resultado final
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <AdminFinalDeliveryCard
              orderId={order.id}
              currentStatus={order.status}
            />

            <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Timeline do pedido</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Acompanhe cada avanço registrado neste atendimento.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {timelineItems.length}
                </span>
              </div>

              <div className="mt-5">
                <AdminOrderAuditTimeline items={timelineItems} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}