import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import AppNav from "@/components/AppNav";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import OrderActionButton from "@/components/OrderActionButton";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import {
  canCreateCheckoutForOrderStatus,
  getOrderFlow,
  isValidOrderStatus,
  type OrderStatus,
} from "@/lib/order-flow";

type OrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function WaitingOperatorScheduleCard() {
  return (
    <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-slate-950">
      <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800">
        Documentos recebidos com sucesso ✅
      </div>

      <h2 className="mt-4 text-2xl font-black text-slate-950">
        Agora vamos localizar o Poupatempo mais próximo
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-700">
        Nossa equipe irá verificar as unidades próximas ao seu endereço e os
        horários disponíveis para atendimento presencial com foto e biometria.
      </p>

      <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4">
        <p className="text-sm font-black text-slate-950">📍 Próxima etapa:</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          O operador irá informar a melhor unidade, endereço e horário
          disponível para o seu atendimento.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-950">Exemplo de retorno:</p>

        <div className="mt-3 space-y-1 text-sm text-slate-700">
          <p className="font-black text-slate-950">
            Poupatempo São José do Rio Preto
          </p>
          <p>📍 Centro</p>
          <p>🕒 Seg–Sex: 9h às 17h</p>
          <p>🕒 Sábado: 9h às 13h</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Você receberá o posicionamento pela plataforma e/ou WhatsApp cadastrado.
      </p>
    </section>
  );
}

export default async function OrderPage({ params }: OrderPageProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.role !== "CLIENT") redirect("/admin/orders");

  const resolvedParams = await params;

  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      service: true,
      uploadedFiles: {
        orderBy: { createdAt: "desc" },
      },
      resultFiles: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order || order.userId !== user.id) redirect("/orders");

  if (!isValidOrderStatus(order.status)) redirect("/orders");

  const status = order.status as OrderStatus;
  const isWaitingScheduleReview =
    status === "WAITING_OPERATOR_SCHEDULE_REVIEW";
    const serviceName = order.service.name.toLowerCase();
    const orderCode = order.orderCode?.toLowerCase() || "";
    const isRG = serviceName.includes("rg") || orderCode.startsWith("rg");
    
  if (canCreateCheckoutForOrderStatus(status)) {
    redirect(`/payment?orderId=${order.id}`);
  }

  const flow = getOrderFlow(status, {
    orderId: order.id,
    filesCount: order.uploadedFiles.length,
    resultFilesCount: order.resultFiles.length,
  });

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm font-bold text-white/75 underline hover:text-white"
          >
            ← Voltar para meus pedidos
          </Link>
        </div>

        <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <OrderStatusBadge status={status} />
                <OrderCodeBadge
                  code={order.orderCode ?? undefined}
                  fallback={order.id.slice(0, 8).toUpperCase()}
                />
              </div>

              <h1 className="mt-4 text-3xl font-black text-slate-950">
                {order.service.name}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
              {isRG && status === "AWAITING_DOCUMENTS"
               ? "Preencha o formulário de pré-agendamento, escolha a unidade do Poupatempo e finalize com um especialista pelo WhatsApp."
             : isRG && status === "WAITING_OPERATOR_SCHEDULE_REVIEW"
               ? "Recebemos seu formulário e a unidade escolhida. Agora nossa equipe irá finalizar o atendimento com você pelo WhatsApp."
             : flow.clientMessage}
              </p>
            </div>

            <div className="w-full lg:max-w-xs">
            {isRG && status === "AWAITING_DOCUMENTS" ? (
                  <Link
              href={`/orders/${order.id}/upload`}
               className="inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white hover:bg-orange-600"
                     >
                   Continuar pré-agendamento
                     </Link>
                          ) : isRG && status === "WAITING_OPERATOR_SCHEDULE_REVIEW" ? (
                    <Link
                   href={`https://wa.me/5517999999999`}
                   target="_blank"
                     className="inline-flex w-full items-center justify-center rounded-2xl bg-green-500 px-4 py-3 text-sm font-black text-white hover:bg-green-600"
                         >
                     Falar com especialista
                      </Link>
                          ) : (
                     <OrderActionButton
                       status={status}
                       orderId={order.id}
                       filesCount={order.uploadedFiles.length}
                       resultFilesCount={order.resultFiles.length}
                       className="w-full bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green-hover)]"
                         />
                        )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Valor do pedido
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Criado em
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Documentos enviados
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {order.uploadedFiles.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Arquivos finais
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                {order.resultFiles.length}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs uppercase tracking-wide text-green-700">
              Próxima etapa
            </p>
            <p className="mt-2 text-base font-black text-green-900">
              {flow.nextStepLabel}
            </p>
          </div>

          {isWaitingScheduleReview && <WaitingOperatorScheduleCard />}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
        <h2 className="text-lg font-black text-slate-950">
       {isRG ? "Pré-agendamento RG" : "Documentos enviados por você"}
           </h2>

              {isRG ? (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
               {status === "WAITING_OPERATOR_SCHEDULE_REVIEW" ? (
               <>
              <p className="font-black">✅ Formulário recebido</p>
              <p className="mt-2">
            Seu formulário de RG foi enviado com sucesso. Nossa equipe irá seguir
            com a finalização do atendimento pelo WhatsApp.
                </p>

           {order.selectedPoupatempoName && (
            <div className="mt-4 rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase text-blue-700">
                Unidade escolhida
              </p>
              <p className="mt-1 font-black text-slate-950">
                {order.selectedPoupatempoName}
              </p>
              <p className="mt-1 text-slate-600">
                {order.selectedPoupatempoAddress || "Endereço não informado"}
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="font-black">Pré-agendamento pendente</p>
          <p className="mt-2">
            Continue o formulário para escolher a unidade do Poupatempo e iniciar
            o atendimento com especialista.
          </p>
        </>
      )}
    </div>
  ) : order.uploadedFiles.length === 0 ? (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
      Você ainda não enviou documentos para este pedido.
    </div>
  ) : (
    <div className="mt-4 space-y-3">
      {order.uploadedFiles.map((file) => (
        <div
          key={file.id}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-sm font-bold text-slate-950">
            {file.originalName}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Enviado em {formatDate(file.createdAt)}
          </p>

          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-white"
          >
            Visualizar arquivo
                      </a>
                     </div>
                 ))}
               </div>
                   )}
                </section>

          <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
            <h2 className="text-lg font-black text-slate-950">
              Resultado final do serviço
            </h2>

            {order.resultFiles.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                {isWaitingScheduleReview
                  ? "O operador ainda está verificando a melhor unidade e horário disponível."
                  : "O resultado final ainda não foi liberado."}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {order.resultFiles.map((file) => (
                  <div
                    key={file.id}
                    className="rounded-2xl border border-green-200 bg-green-50 p-4"
                  >
                    <p className="text-sm font-bold text-green-900">
                      {file.originalName}
                    </p>

                    <p className="mt-1 text-xs text-green-700">
                      Liberado em {formatDate(file.createdAt)}
                    </p>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--accent-green-hover)]"
                    >
                      Baixar arquivo
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}