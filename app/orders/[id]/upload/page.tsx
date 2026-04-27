"use client";

import { useEffect, useMemo, useState } from "react";
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

type AllowedUploadStatus = "PAID" | "AWAITING_DOCUMENTS" | "PROCESSING";

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
  } | null;
  uploadedFiles?: UploadedFileItem[];
  serviceDocuments?: ServiceDocument[];
  requiredDocuments?: ServiceDocument[];
  businessHours?: {
    waitingForBusinessHours?: boolean;
  };
};

function canUploadForStatus(status?: string): status is AllowedUploadStatus {
return status === "PAID" || status === "AWAITING_DOCUMENTS" || status === "PROCESSING";
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
      return "Carregando pedido";
  }
}

function getFileTypeLabel(type?: string | null) {
  if (!type) return "Documento";
  return type;
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
  const [progress, setProgress] = useState(0);

  const serviceType = useMemo(
    () => resolveServiceTypeFromService(order?.service),
    [order?.service]
  );

  const serviceDocuments = useMemo(
    () => getServiceDocuments(serviceType),
    [serviceType]
  );

  const requiredDocuments = useMemo(
    () => getRequiredDocumentsForService(serviceType),
    [serviceType]
  );

  const uploadAllowed = canUploadForStatus(order?.status);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (!res.ok) return;

      const data: OrderData = await res.json();
      setOrder(data);

      const uploaded = (data.uploadedFiles || [])
        .map((f) => f.type)
        .filter(Boolean) as string[];

      const progressCalc = requiredDocuments.length
        ? Math.min(
            100,
            Math.round((uploaded.length / requiredDocuments.length) * 100)
          )
        : uploaded.length > 0
          ? 100
          : 0;

      setProgress(progressCalc);
    }

    load();
  }, [orderId, requiredDocuments.length]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      setError(validation.error || "Arquivo inválido.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!selectedType) {
      setError("Selecione o tipo de documento antes de enviar.");
      return;
    }

    if (!file) {
      setError("Selecione um arquivo antes de enviar.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);
      formData.append("type", selectedType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar documento.");
        return;
      }

      setSuccess("Documento enviado com sucesso.");
      setFile(null);
      setSelectedType("");

      const updated = await fetch(`/api/orders/${orderId}`, {
        cache: "no-store",
      });

      if (updated.ok) {
        const updatedData: OrderData = await updated.json();
        setOrder(updatedData);

        const uploaded = (updatedData.uploadedFiles || [])
          .map((f) => f.type)
          .filter(Boolean) as string[];

        const progressCalc = requiredDocuments.length
          ? Math.min(
              100,
              Math.round((uploaded.length / requiredDocuments.length) * 100)
            )
          : uploaded.length > 0
            ? 100
            : 0;

        setProgress(progressCalc);
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 pb-28 pt-6 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <Link
            href={`/orders/${orderId}`}
            className="text-sm font-bold text-white/75 underline hover:text-white"
          >
            ← Voltar para o pedido
          </Link>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            Área do cliente
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            Envio de documentos
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/75 sm:text-base">
            Envie os documentos necessários para darmos andamento ao seu pedido.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <OrderCodeBadge
              code={order?.orderCode}
              fallback={orderId.slice(0, 8).toUpperCase()}
            />

            <span className="inline-flex w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white">
              {getStatusLabel(order?.status)}
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
              <span>Progresso do envio</span>
              <span>{progress}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[var(--accent-green)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        {uploadAllowed ? (
          <section className="mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl sm:p-7">
            <h2 className="text-xl font-black">Enviar documento</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Selecione o tipo de documento, escolha o arquivo no celular e
              envie. Fotos nítidas e legíveis ajudam a acelerar o atendimento.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">
                  Tipo de documento
                </label>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DocumentKey)}
                  className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base font-bold text-slate-900 outline-none focus:border-[var(--accent-green)]"
                >
                  <option value="">Selecione o documento</option>

                  {serviceDocuments.map((doc) => (
                    <option key={doc.key} value={doc.key}>
                      {doc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">
                  Arquivo
                </label>

                <label className="flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:bg-slate-100">
                  <span className="text-base font-black text-slate-900">
                    {file ? "Arquivo selecionado" : "Selecionar documento"}
                  </span>

                  <span className="mt-1 break-all text-sm text-slate-500">
                    {file ? file.name : "Toque aqui para escolher foto ou arquivo"}
                  </span>

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                  {success}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={loading}
                className="hidden w-full rounded-2xl bg-[var(--accent-green)] px-5 py-4 text-base font-black uppercase text-white shadow-lg transition hover:bg-[var(--accent-green-hover)] disabled:cursor-not-allowed disabled:opacity-70 sm:block"
              >
                {loading ? "Enviando..." : "Enviar documento"}
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl sm:p-7">
            <h2 className="text-xl font-black">Envio indisponível</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              O envio de documentos não está disponível para o status atual do
              pedido.
            </p>
          </section>
        )}

        <section className="mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Arquivos enviados</h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              {order?.uploadedFiles?.length || 0}
            </span>
          </div>

          {(order?.uploadedFiles || []).length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Nenhum documento enviado ainda.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {(order?.uploadedFiles || []).map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {getFileTypeLabel(uploadedFile.type)}
                  </p>

                  <p className="mt-1 break-all text-sm font-black text-slate-950">
                    {uploadedFile.originalName || "Documento enviado"}
                  </p>

                  {uploadedFile.url && (
                    <a
                      href={uploadedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100 sm:w-auto"
                    >
                      Abrir arquivo
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {uploadAllowed && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[var(--primary-blue)]/95 p-4 backdrop-blur sm:hidden">
          <button
            onClick={handleUpload}
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-[var(--accent-green)] text-base font-black uppercase text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar documento"}
          </button>
        </div>
      )}
    </main>
  );
}