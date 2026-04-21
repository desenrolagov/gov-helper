import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import AdminOrderAuditTimeline from "@/components/admin/AdminOrderAuditTimeline";
import AdminFinalDeliveryCard from "@/components/admin/AdminFinalDeliveryCard";

export const dynamic = "force-dynamic";

type UploadedFileItem = {
  id: string;
  originalName: string | null;
  type: string | null;
  url: string;
  createdAt: Date;
};

type ResultFileItem = {
  id: string;
  originalName: string | null;
  url: string;
  createdAt: Date;
};

type TimelineItem = {
  id: string;
  title: string;
  description?: string | null;
  timestamp: string;
  tone?: "slate" | "blue" | "amber" | "green" | "red";
  badge?: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentStatusValue = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDocumentLabel(type?: string | null) {
  if (!type) return "Documento";

  const map: Record<string, string> = {
    rg: "RG",
    cpf: "CPF",
    comprovante_residencia: "Comprovante de residência",
    selfie_documento: "Selfie com documento",
    documento_adicional: "Documento adicional",
    documento_com_foto: "Documento com foto",
    selfie_com_documento: "Selfie com documento",
    comprovante_cpf: "Comprovante de situação do CPF",
    comprovante_cpf_pdf: "Comprovante de situação do CPF",
    certidao_nascimento: "Certidão de nascimento",
    certidao_casamento: "Certidão de casamento",
  };

  return map[type] || type;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: "Aguardando pagamento",
    PAID: "Pagamento aprovado",
    AWAITING_DOCUMENTS: "Aguardando documentos",
    PROCESSING: "Em andamento",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };

  return map[status] || status;
}

function getStatusTone(
  status: string
): "slate" | "blue" | "amber" | "green" | "red" {
  switch (status) {
    case "PENDING_PAYMENT":
    case "AWAITING_DOCUMENTS":
      return "amber";
    case "PAID":
    case "PROCESSING":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "red";
    default:
      return "slate";
  }
}

function getAuditTone(
  action: string
): "slate" | "blue" | "amber" | "green" | "red" {
  if (
    action.includes("COMPLETED") ||
    action.includes("RESULT_FILE") ||
    action.includes("FINAL")
  ) {
    return "green";
  }

  if (action.includes("PAYMENT") || action.includes("STATUS")) {
    return "blue";
  }

  if (action.includes("DOCUMENT") || action.includes("UPLOAD")) {
    return "amber";
  }

  return "slate";
}

function getOperationalHint(
  status: string,
  totalUploads: number,
  totalResults: number
) {
  if (status === "PENDING_PAYMENT") {
    return "O pedido ainda depende da confirmação do pagamento para seguir no fluxo.";
  }

  if (status === "PAID") {
    return totalUploads > 0
      ? "Pagamento confirmado e documentos já recebidos. O pedido pode avançar para andamento."
      : "Pagamento confirmado. Agora o cliente precisa enviar os documentos obrigatórios.";
  }

  if (status === "AWAITING_DOCUMENTS") {
    return totalUploads > 0
      ? "Há arquivos enviados, mas o pedido ainda está marcado com pendência documental. Revise o caso."
      : "Ainda não há documentos enviados pelo cliente.";
  }

  if (status === "PROCESSING") {
    return totalResults > 0
      ? "O pedido está em andamento e já possui resultado final anexado. A conclusão pode ser feita com segurança."
      : "O pedido está em andamento. Envie o arquivo final quando o atendimento estiver concluído.";
  }

  if (status === "COMPLETED") {
    return totalResults > 0
      ? "Pedido concluído e com resultado final vinculado ao cliente."
      : "Pedido concluído sem resultado final visível. Esse caso precisa ser revisado.";
  }

  if (status === "CANCELLED") {
    return "Pedido cancelado. Não há nova ação operacional pendente.";
  }

  return "Acompanhe a timeline e os arquivos do pedido para decidir a próxima ação.";
}

export default async function AdminOrderDetailsPage({ params }: PageProps) {
  const session = await verifySession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      service: true,
      uploadedFiles: {
        orderBy: { createdAt: "desc" },
      },
      resultFiles: {
        orderBy: { createdAt: "desc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      histories: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    redirect("/admin/orders");
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
  });

  const totalUploads = order.uploadedFiles.length;
  const totalResults = order.resultFiles.length;

  const paid = order.payments.some(
    (payment: { status: PaymentStatusValue }) => payment.status === "PAID"
  );

  const timelineItems: TimelineItem[] = [
    ...order.histories.map((item): TimelineItem => ({
      id: `history-${item.id}`,
      title: `Status alterado para ${getStatusLabel(item.status)}`,
      description: "Mudança registrada no fluxo operacional do pedido.",
      timestamp: formatDate(item.createdAt),
      tone: getStatusTone(item.status),
      badge: "Status",
    })),
    ...order.payments.map((payment): TimelineItem => ({
      id: `payment-${payment.id}`,
      title:
        payment.status === "PAID"
          ? "Pagamento confirmado"
          : `Pagamento ${payment.status.toLowerCase()}`,
      description: `Valor ${formatCurrency(payment.amount)}.`,
      timestamp: formatDate(payment.createdAt),
      tone: payment.status === "PAID" ? "green" : "amber",
      badge: "Pagamento",
    })),
    ...order.uploadedFiles.map((file: UploadedFileItem): TimelineItem => ({
      id: `upload-${file.id}`,
      title: "Documento enviado pelo cliente",
      description: `${file.originalName || "Arquivo"} • ${getDocumentLabel(
        file.type
      )}`,
      timestamp: formatDate(file.createdAt),
      tone: "amber",
      badge: "Upload",
    })),
    ...order.resultFiles.map((file: ResultFileItem): TimelineItem => ({
      id: `result-${file.id}`,
      title: "Resultado final enviado",
      description: file.originalName || "Arquivo final",
      timestamp: formatDate(file.createdAt),
      tone: "green",
      badge: "Entrega final",
    })),
    ...auditLogs.map((log): TimelineItem => ({
      id: `audit-${log.id}`,
      title: log.message || log.action,
      description:
        typeof log.entityType === "string"
          ? `Evento em ${log.entityType}.`
          : "Evento operacional registrado.",
      timestamp: formatDate(log.createdAt),
      tone: getAuditTone(log.action),
      badge: "Auditoria",
    })),
  ];

  const operationalSummary = [
    {
      label: "Pedido criado",
      value: formatDate(order.createdAt),
    },
    {
      label: "Última atualização",
      value: formatDate(order.updatedAt),
    },
    {
      label: "Último status",
      value: getStatusLabel(order.status),
    },
    {
      label: "Logs de auditoria",
      value: String(auditLogs.length),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Painel Admin
              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                Pedido {order.orderCode || order.id.slice(0, 8)}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <span className="text-sm text-slate-500">
                  Cliente: {order.user.name} ({order.user.email})
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Serviço: {order.service?.name || "Serviço não informado"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href={`/orders/${order.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Abrir visão do cliente
              </Link>

              <Link
                href="/admin/orders"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Valor</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Pagamento</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {paid ? "Confirmado" : "Pendente"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Uploads do cliente</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {totalUploads}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Resultados finais</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {totalResults}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Leitura operacional
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {getOperationalHint(order.status, totalUploads, totalResults)}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {operationalSummary.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Documentos enviados pelo cliente
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Arquivos utilizados para análise e execução do pedido.
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {totalUploads} arquivo{totalUploads === 1 ? "" : "s"}
                </span>
              </div>

              {order.uploadedFiles.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Nenhum documento enviado até o momento.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.uploadedFiles.map((file: UploadedFileItem) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {file.originalName || "Arquivo"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Tipo: {getDocumentLabel(file.type)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Enviado em: {formatDate(file.createdAt)}
                          </p>
                        </div>

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Abrir arquivo
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Resultado final enviado ao cliente
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Arquivos finais entregues após a conclusão do atendimento.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {totalResults} resultado{totalResults === 1 ? "" : "s"}
                </span>
              </div>

              {order.resultFiles.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">
                    Nenhum resultado enviado ainda.
                  </p>
                  <p className="mt-1">
                    Assim que o arquivo final for anexado, ele aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {order.resultFiles.map((file: ResultFileItem) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {file.originalName || "Arquivo final"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Enviado em: {formatDate(file.createdAt)}
                          </p>
                        </div>

                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Visualizar resultado
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <Link
                  href={`/admin/orders/${order.id}/upload-result`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tela dedicada de upload
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AdminFinalDeliveryCard
              orderId={order.id}
              currentStatus={order.status}
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Timeline do pedido
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Histórico visual de status, pagamento, uploads e eventos de
                auditoria.
              </p>

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