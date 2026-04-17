"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import { validateFile } from "@/lib/uploadValidation";
import {
  getRequiredDocumentsForService,
  getServiceDocuments,
  resolveServiceTypeFromService,
  type DocumentKey,
  type ServiceDocument,
} from "@/lib/service-documents";

type AllowedUploadStatus = "PAID" | "AWAITING_DOCUMENTS";

type UploadedFileItem = {
  id: string;
  type?: string | null;
  originalName?: string | null;
  url?: string | null;
  createdAt?: string;
};

type OrderData = {
  id: string;
  orderCode?: string | null;
  status?: string;
  service?: {
    id?: string | null;
    name?: string | null;
    codePrefix?: string | null;
  } | null;
  uploadedFiles?: UploadedFileItem[];
  serviceDocuments?: ServiceDocument[];
  requiredDocuments?: ServiceDocument[];
  pendingRequiredDocuments?: ServiceDocument[];
  businessHours?: {
    withinBusinessHours?: boolean;
    waitingForBusinessHours?: boolean;
    notice?: string | null;
  };
  flags?: {
    hasAllRequiredDocuments?: boolean;
  };
};

type UploadResponse = {
  message?: string;
  error?: string;
  file?: UploadedFileItem;
  uploadedFiles?: UploadedFileItem[];
  requiredDocuments?: ServiceDocument[];
  pendingDocuments?: ServiceDocument[];
  status?: string;
  movedToProcessing?: boolean;
  withinBusinessHours?: boolean;
  waitingForBusinessHours?: boolean;
  hasAllRequiredDocuments?: boolean;
};

function canUploadForStatus(status?: string): status is AllowedUploadStatus {
  return status === "PAID" || status === "AWAITING_DOCUMENTS";
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return "Pagamento aprovado";
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos";
    case "PROCESSING":
      return "Em andamento";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Não identificado";
  }
}

function getStatusMessage(options: {
  status?: string;
  waitingForBusinessHours?: boolean;
  allRequiredDocumentsSent?: boolean;
}) {
  const { status, waitingForBusinessHours, allRequiredDocumentsSent } = options;

  if (
    status === "AWAITING_DOCUMENTS" &&
    waitingForBusinessHours &&
    allRequiredDocumentsSent
  ) {
    return "Recebemos todos os documentos obrigatórios. Como o envio foi realizado fora do horário comercial, seu pedido ficará em fila e será assumido pela equipe no próximo período de atendimento.";
  }

  switch (status) {
    case "PAID":
      return "Seu pagamento foi aprovado. Agora envie os documentos necessários para continuar o atendimento.";
    case "AWAITING_DOCUMENTS":
      return "Estamos aguardando o envio dos documentos obrigatórios para iniciar a análise.";
    case "PROCESSING":
      return "Recebemos seus documentos e seu pedido já está em análise.";
    case "COMPLETED":
      return "Seu pedido foi concluído. Os arquivos finais estão disponíveis na página do pedido.";
    case "PENDING_PAYMENT":
      return "O envio de documentos será liberado após a confirmação do pagamento.";
    case "CANCELLED":
      return "Este pedido foi cancelado e não aceita novos envios.";
    default:
      return "Não foi possível identificar a etapa atual do pedido.";
  }
}

function getDocumentTypeLabel(type?: string | null, fallback?: string) {
  if (!type) return fallback || "Documento";

  const labels: Record<string, string> = {
    rg: "RG",
    cpf: "CPF",
    comprovante_residencia: "Comprovante de residência",
    selfie_documento: "Selfie com documento",
    certidao_nascimento: "Certidão de nascimento",
    certidao_casamento: "Certidão de casamento",
    documento_adicional: "Documento adicional",
    documento_com_foto: "Documento com foto (RG ou CNH)",
    comprovante_cpf: "Comprovante de situação do CPF",
    DOCUMENTO_FOTO: "Documento com foto (RG ou CNH)",
    SELFIE_COM_DOCUMENTO: "Selfie segurando o documento",
    CERTIDAO_CIVIL: "Certidão de nascimento ou casamento",
    COMPROVANTE_ENDERECO: "Comprovante de endereço",
    COMPROVANTE_CPF: "Comprovante de situação do CPF ou print da pendência",
    CNH_ATUAL: "Foto ou cópia da CNH atual",
    BOLETIM_OCORRENCIA: "Boletim de ocorrência",
    COMPROVANTE_PAGAMENTO_GUIA: "Comprovante de pagamento da guia",
    CERTIDAO_NEGATIVA_BASE: "Documento base da certidão",
    DOCUMENTO_EMPRESA: "Documento da empresa",
    COMPROVANTE_CNPJ: "Comprovante do CNPJ",
    COMPROVANTE_MEI: "Comprovante do MEI",
  };

  return labels[type] || fallback || type;
}

function formatDate(value?: string) {
  if (!value) return "Data não informada";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentKey | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [requiredFiles, setRequiredFiles] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string | undefined>(
    undefined
  );
  const [uploadedTypes, setUploadedTypes] = useState<string[]>([]);

  const serviceType = useMemo(
    () => resolveServiceTypeFromService(order?.service),
    [order?.service]
  );

  const fallbackServiceDocuments = useMemo(
    () => getServiceDocuments(serviceType),
    [serviceType]
  );

  const fallbackRequiredDocuments = useMemo(
    () => getRequiredDocumentsForService(serviceType),
    [serviceType]
  );

  const serviceDocuments = useMemo(
    () =>
      order?.serviceDocuments && order.serviceDocuments.length > 0
        ? order.serviceDocuments
        : fallbackServiceDocuments,
    [order?.serviceDocuments, fallbackServiceDocuments]
  );

  const requiredDocuments = useMemo(
    () =>
      order?.requiredDocuments && order.requiredDocuments.length > 0
        ? order.requiredDocuments
        : fallbackRequiredDocuments,
    [order?.requiredDocuments, fallbackRequiredDocuments]
  );

  const allRequiredDocumentsSent =
    requiredFiles > 0 && uploadedFiles >= requiredFiles;

  const uploadAllowed = useMemo(
    () => canUploadForStatus(currentStatus ?? order?.status),
    [currentStatus, order?.status]
  );

  const waitingForBusinessHours =
    !!order?.businessHours?.waitingForBusinessHours &&
    allRequiredDocumentsSent &&
    (currentStatus ?? order?.status) === "AWAITING_DOCUMENTS";

  const loadOrder = useCallback(async () => {
    try {
      setLoadingOrder(true);
      setError("");

      const res = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        setOrder(null);
        setError("Não foi possível carregar os dados do pedido.");
        return;
      }

      const data: OrderData = await res.json();

      setOrder(data);
      setCurrentStatus(data?.status);

      if (data?.status === "PENDING_PAYMENT") {
        router.replace(`/payment?orderId=${orderId}`);
        return;
      }

      if (
        data?.status &&
        data.status !== "PAID" &&
        data.status !== "AWAITING_DOCUMENTS" &&
        data.status !== "PROCESSING" &&
        data.status !== "COMPLETED"
      ) {
        router.replace(`/orders/${orderId}`);
        return;
      }

      const resolvedRequiredDocuments =
        data.requiredDocuments && data.requiredDocuments.length > 0
          ? data.requiredDocuments
          : getRequiredDocumentsForService(resolveServiceTypeFromService(data.service));

      const existingUploadedTypes = [
        ...new Set(
          (data.uploadedFiles || [])
            .map((item) => item.type)
            .filter((value): value is string => Boolean(value))
        ),
      ];

      const uploadedRequiredCount = resolvedRequiredDocuments.filter((doc) =>
        existingUploadedTypes.includes(doc.key)
      ).length;

      const calculatedProgress = resolvedRequiredDocuments.length
        ? Math.round(
            (uploadedRequiredCount / resolvedRequiredDocuments.length) * 100
          )
        : 0;

      setUploadedTypes(existingUploadedTypes);
      setUploadedFiles(uploadedRequiredCount);
      setRequiredFiles(resolvedRequiredDocuments.length);
      setProgress(Math.min(100, calculatedProgress));
    } catch (err) {
      console.error("Erro ao carregar pedido:", err);
      setOrder(null);
      setError("Erro ao carregar o pedido.");
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (orderId) {
      void loadOrder();
    }
  }, [orderId, loadOrder]);

  useEffect(() => {
    if (!order?.id || !order?.status) return;

    if (order.status === "PENDING_PAYMENT") {
      router.replace(`/payment?orderId=${order.id}`);
      return;
    }

    if (
      order.status !== "PAID" &&
      order.status !== "AWAITING_DOCUMENTS" &&
      order.status !== "PROCESSING" &&
      order.status !== "COMPLETED"
    ) {
      router.replace(`/orders/${order.id}`);
      return;
    }
  }, [order?.id, order?.status, router]);

  useEffect(() => {
    if (!orderId || !currentStatus) return;

    if (currentStatus === "PROCESSING") {
      const timeout = setTimeout(() => {
        router.replace(`/orders/${orderId}`);
      }, 1800);

      return () => clearTimeout(timeout);
    }

    if (currentStatus === "COMPLETED") {
      const timeout = setTimeout(() => {
        router.replace(`/orders/${orderId}`);
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [currentStatus, orderId, router]);

  const selectedDocumentLabel =
    serviceDocuments.find((doc) => doc.key === selectedType)?.label || "";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      setFile(null);
      setError(validation.error || "Arquivo inválido.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    try {
      setError("");
      setSuccess("");

      if (!orderId) {
        setError("ID do pedido não encontrado.");
        return;
      }

      if (!order) {
        setError("Pedido não encontrado.");
        return;
      }

      if (!uploadAllowed) {
        setError("O envio de documentos não está liberado nesta etapa.");
        return;
      }

      if (!selectedType) {
        setError("Selecione qual documento está sendo enviado.");
        return;
      }

      if (!file) {
        setError("Selecione um arquivo antes de enviar.");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);
      formData.append("type", selectedType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar arquivo.");
        return;
      }

      const nextStatus = data.status;
      if (nextStatus) {
        setCurrentStatus(nextStatus);
      }

      if (Array.isArray(data.uploadedFiles)) {
        const nextUploadedTypes = [
          ...new Set(
            data.uploadedFiles
              .map((item) => item.type)
              .filter((value): value is string => Boolean(value))
          ),
        ];

        setUploadedTypes(nextUploadedTypes);

        const nextUploadedRequiredCount = requiredDocuments.filter((doc) =>
          nextUploadedTypes.includes(doc.key)
        ).length;

        setUploadedFiles(nextUploadedRequiredCount);

        const nextRequiredCount = requiredDocuments.length;
        setRequiredFiles(nextRequiredCount);

        const nextProgress = nextRequiredCount
          ? Math.round((nextUploadedRequiredCount / nextRequiredCount) * 100)
          : 0;

        setProgress(Math.min(100, nextProgress));
      }

      setFile(null);
      setSelectedType("");

      if (nextStatus === "PROCESSING" || data.movedToProcessing) {
        setSuccess(
          "Todos os documentos obrigatórios foram enviados com sucesso. Seu pedido foi encaminhado para análise e você será redirecionado."
        );
        await loadOrder();
        return;
      }

      if (data.waitingForBusinessHours && data.hasAllRequiredDocuments) {
        setSuccess(
          data.message ||
            "Recebemos todos os documentos obrigatórios. Como o envio ocorreu fora do horário comercial, seu pedido ficará na fila e será assumido pela equipe no próximo período de atendimento."
        );
        await loadOrder();
        router.refresh();
        return;
      }

      await loadOrder();
      router.refresh();

      setSuccess(data.message || "Documento enviado com sucesso.");
    } catch (err) {
      console.error("Erro ao enviar arquivo:", err);
      setError("Erro inesperado ao enviar arquivo.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingOrder) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-slate-600">Carregando pedido...</p>
      </main>
    );
  }

  const status = currentStatus ?? order?.status;
  const filesList = order?.uploadedFiles ?? [];
  const showTopInfo =
    !success &&
    !error &&
    allRequiredDocumentsSent &&
    !waitingForBusinessHours &&
    status !== "PROCESSING" &&
    status !== "COMPLETED";

  const hideUploadForm =
    status === "PROCESSING" ||
    status === "COMPLETED" ||
    allRequiredDocumentsSent;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Envio de documentos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Serviço: {order?.service?.name || "Não informado"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {order?.orderCode ? (
            <OrderCodeBadge code={order.orderCode} fallback="—" />
          ) : null}

          <Link
            href={`/orders/${orderId}`}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar ao pedido
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">
          Status atual: {getStatusLabel(status)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {getStatusMessage({
            status,
            waitingForBusinessHours,
            allRequiredDocumentsSent,
          })}
        </p>
      </div>

      {waitingForBusinessHours ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {order?.businessHours?.notice ||
            "Recebemos todos os documentos obrigatórios fora do horário comercial. Seu pedido está na fila e será assumido pela equipe no próximo período de atendimento."}
        </div>
      ) : null}

      {showTopInfo ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Todos os documentos obrigatórios já foram enviados. Aguarde enquanto o
          pedido é encaminhado automaticamente para a próxima etapa.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Progresso dos documentos obrigatórios
            </p>
            <p className="text-sm text-slate-600">
              {uploadedFiles} de {requiredFiles} enviados
            </p>
          </div>

          <span className="text-lg font-bold text-slate-900">{progress}%</span>
        </div>

        <div className="mt-4 h-3 w-full rounded-full bg-slate-200">
          <div
            className="h-3 rounded-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Documentos necessários
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Envie os arquivos abaixo para dar continuidade ao atendimento.
          </p>

          <div className="mt-4 space-y-3">
            {serviceDocuments.map((doc) => {
              const uploaded = uploadedTypes.includes(doc.key);

              return (
                <div
                  key={doc.key}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {doc.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {doc.required ? "Obrigatório" : "Opcional"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        uploaded
                          ? "bg-green-100 text-green-700"
                          : doc.required
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {uploaded
                        ? "Enviado"
                        : doc.required
                        ? "Pendente"
                        : "Opcional"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {requiredDocuments.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Este serviço não possui documentos obrigatórios cadastrados.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Enviar novo arquivo
          </h2>

          {hideUploadForm ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {waitingForBusinessHours
                ? "Todos os documentos obrigatórios já foram recebidos. Como o envio ocorreu fora do horário comercial, o pedido ficará na fila até o próximo período de atendimento."
                : status === "PROCESSING"
                ? "Todos os documentos já foram recebidos e o pedido está em análise."
                : status === "COMPLETED"
                ? "Este pedido já foi concluído. Novos envios não são necessários."
                : "Todos os documentos obrigatórios já foram enviados. Aguarde a próxima atualização do pedido."}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tipo do documento
                </label>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DocumentKey)}
                  disabled={!uploadAllowed || loading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">Selecione um documento</option>
                  {serviceDocuments.map((doc) => (
                    <option key={doc.key} value={doc.key}>
                      {doc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Arquivo
                </label>

                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={!uploadAllowed || loading}
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              {selectedDocumentLabel ? (
                <p className="text-xs text-slate-500">
                  Documento selecionado: {selectedDocumentLabel}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!uploadAllowed || loading || !selectedType || !file}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar documento"}
              </button>
            </div>
          )}

          {!uploadAllowed && !hideUploadForm ? (
            currentStatus === "PROCESSING" ? (
              <p className="mt-4 text-xs font-medium text-green-700">
                Seu pedido já está em análise.
              </p>
            ) : currentStatus === "COMPLETED" ? (
              <p className="mt-4 text-xs font-medium text-green-700">
                Este pedido já foi concluído.
              </p>
            ) : currentStatus === "CANCELLED" ? (
              <p className="mt-4 text-xs font-medium text-red-600">
                Este pedido foi cancelado e não aceita novos envios.
              </p>
            ) : (
              <p className="mt-4 text-xs text-red-600">
                O envio está bloqueado nesta etapa do pedido.
              </p>
            )
          ) : null}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Arquivos já enviados
        </h2>

        <div className="mt-4 space-y-3">
          {filesList.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nenhum arquivo enviado até o momento.
            </p>
          ) : (
            filesList.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.originalName || "Arquivo"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tipo: {getDocumentTypeLabel(item.type, item.type || "Documento")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Enviado em: {formatDate(item.createdAt)}
                </p>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                  >
                    Abrir arquivo
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}