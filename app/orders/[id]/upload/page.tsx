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
          : getRequiredDocumentsForService(
              resolveServiceTypeFromService(data.service)
            );

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
      <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20">
          <p className="text-sm text-white/75">Carregando pedido...</p>
        </div>
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
  <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">

      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">
            Envio de documentos
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Serviço: {order?.service?.name || "Não informado"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {order?.orderCode ? (
            <OrderCodeBadge code={order.orderCode} fallback="—" />
          ) : null}

          <Link
            href={`/orders/${orderId}`}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Voltar ao pedido
          </Link>
        </div>
      </div>

      {/* STATUS */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[var(--primary-blue-strong)] p-5 shadow-xl shadow-black/20">
        <p className="text-sm font-bold text-white">
          Status: {getStatusLabel(status)}
        </p>
        <p className="mt-2 text-sm text-white/70">
          {getStatusMessage({
            status,
            waitingForBusinessHours,
            allRequiredDocumentsSent,
          })}
        </p>
      </div>

      {/* ALERTAS */}
      {error && (
        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-2xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-200">
          {success}
        </div>
      )}

      {/* PROGRESSO */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[var(--primary-blue-strong)] p-5">
        <div className="flex justify-between">
          <p className="text-sm text-white/80">
            {uploadedFiles} de {requiredFiles} enviados
          </p>
          <span className="font-bold">{progress}%</span>
        </div>

        <div className="mt-3 h-3 w-full rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-[var(--accent-green)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* GRID */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">

        {/* DOCUMENTOS */}
        <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
          <h2 className="text-lg font-bold">Documentos necessários</h2>

          <div className="mt-4 space-y-3">
            {serviceDocuments.map((doc) => {
              const uploaded = uploadedTypes.includes(doc.key);

              return (
                <div key={doc.key} className="rounded-xl border p-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">{doc.label}</span>

                    <span
                      className={`text-xs font-bold ${
                        uploaded
                          ? "text-green-600"
                          : doc.required
                          ? "text-yellow-600"
                          : "text-slate-500"
                      }`}
                    >
                      {uploaded ? "Enviado" : "Pendente"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* UPLOAD */}
        <section className="rounded-2xl bg-white p-5 text-black shadow-xl">
          <h2 className="text-lg font-bold">Enviar documento</h2>

          {hideUploadForm ? (
            <p className="mt-4 text-sm text-slate-600">
              Todos os documentos já foram enviados ou o pedido está em análise.
            </p>
          ) : (
            <div className="mt-4 space-y-4">

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="">Selecione</option>
                {serviceDocuments.map((doc) => (
                  <option key={doc.key} value={doc.key}>
                    {doc.label}
                  </option>
                ))}
              </select>

              <input
                type="file"
                onChange={handleFileChange}
                className="w-full"
              />

              <button
                onClick={handleUpload}
                disabled={!selectedType || !file || loading}
                className="w-full rounded-xl bg-[var(--accent-green)] py-3 text-white font-bold hover:bg-[var(--accent-green-hover)]"
              >
                {loading ? "Enviando..." : "Enviar documento"}
              </button>

            </div>
          )}
        </section>

      </div>

      {/* LISTA DE ARQUIVOS */}
      <section className="mt-6 rounded-2xl bg-white p-5 text-black shadow-xl">
        <h2 className="text-lg font-bold">Arquivos enviados</h2>

        <div className="mt-4 space-y-3">
          {filesList.length === 0 ? (
            <p className="text-sm text-slate-600">
              Nenhum arquivo enviado.
            </p>
          ) : (
            filesList.map((item) => (
              <div key={item.id} className="border p-4 rounded-xl">
                <p className="font-semibold">
                  {item.originalName}
                </p>

                <p className="text-xs text-slate-500">
                  {getDocumentTypeLabel(item.type)}
                </p>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    className="text-blue-600 underline text-sm"
                  >
                    Abrir arquivo
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  </main>
);
}