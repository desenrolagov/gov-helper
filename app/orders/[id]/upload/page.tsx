"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import {
  getRequiredDocumentsForService,
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
    case "WAITING_OPERATOR_SCHEDULE_REVIEW":
      return "Aguardando unidade e horário";
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

function WaitingBlock() {
  return (
    <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-slate-900">
      <p className="text-xs font-black uppercase tracking-wide text-amber-800">
        Etapa concluída ✅
      </p>

      <h2 className="mt-2 text-xl font-black">Documentos enviados com sucesso</h2>

      <p className="mt-2 text-sm text-slate-700">
        Agora nossa equipe irá localizar o Poupatempo mais próximo e verificar
        os horários disponíveis para atendimento presencial com foto e biometria.
      </p>

      <div className="mt-4 rounded-2xl bg-white p-4">
        <p className="text-sm font-black">📍 Próxima etapa:</p>
        <p className="mt-1 text-sm text-slate-700">
          O operador irá informar a unidade e o melhor horário disponível.
        </p>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Você receberá o retorno pela plataforma ou WhatsApp.
      </p>
    </div>
  );
}

export default function OrderUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [progress, setProgress] = useState(0);

  const serviceType = useMemo(
    () => resolveServiceTypeFromService(order?.service),
    [order?.service]
  );

  const requiredDocuments = useMemo(() => {
    return getRequiredDocumentsForService(serviceType).slice(0, 2);
  }, [serviceType]);

  const uploadedTypes = useMemo(() => {
    return new Set(
      (order?.uploadedFiles || [])
        .map((file) => file.type)
        .filter(Boolean) as string[]
    );
  }, [order?.uploadedFiles]);

  const uploadedRequiredCount = requiredDocuments.filter((doc) =>
    uploadedTypes.has(doc.key)
  ).length;

  const currentDocument = requiredDocuments.find(
    (doc) => !uploadedTypes.has(doc.key)
  );

  const currentStep = Math.min(uploadedRequiredCount + 1, 2);
  const uploadAllowed = canUploadForStatus(order?.status);
  const isWaiting = order?.status === "WAITING_OPERATOR_SCHEDULE_REVIEW";
  const allRequiredSent = requiredDocuments.length === 2 && uploadedRequiredCount >= 2;

  async function loadOrder() {
    const res = await fetch(`/api/orders/${orderId}`, {
      cache: "no-store",
    });

    if (!res.ok) return;

    const data: OrderData = await res.json();
    setOrder(data);

    const currentServiceType = resolveServiceTypeFromService(data.service);
    const docs = getRequiredDocumentsForService(currentServiceType).slice(0, 2);

    const uploaded = new Set(
      (data.uploadedFiles || [])
        .map((file) => file.type)
        .filter(Boolean) as string[]
    );

    const sentCount = docs.filter((doc) => uploaded.has(doc.key)).length;
    const progressCalc = docs.length ? Math.round((sentCount / docs.length) * 100) : 0;

    setProgress(progressCalc);
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function handleUpload() {
    if (!currentDocument) {
      setError("Todos os documentos obrigatórios já foram enviados.");
      return;
    }

    if (!file) {
      setError(`Selecione o arquivo: ${currentDocument.label}.`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);
      formData.append("type", currentDocument.key as DocumentKey);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar documento.");
        return;
      }

      setFile(null);

      await loadOrder();
      router.refresh();

      if (currentStep >= 2) {
        setSuccess("Documentos enviados. Agora vamos verificar unidade e horário.");
      } else {
        setSuccess("Documento enviado. Agora envie o próximo documento.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href={`/orders/${orderId}`} className="text-sm text-white/70 underline">
          ← Voltar
        </Link>

        <div className="mt-4">
          <OrderCodeBadge code={order?.orderCode} fallback={orderId.slice(0, 8)} />
        </div>

        <div className="mt-4">
          <span className="text-sm font-bold">{getStatusLabel(order?.status)}</span>
        </div>

        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-green-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-2 text-xs font-semibold text-white/80">
          {Math.min(uploadedRequiredCount, 2)}/2 documentos enviados
        </p>

        {(isWaiting || allRequiredSent) && <WaitingBlock />}

        {!isWaiting && !allRequiredSent && uploadAllowed && currentDocument && (
          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Etapa {currentStep}/2
            </p>

            <h1 className="mt-2 text-2xl font-black">
              Envie: {currentDocument.label}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Para o serviço de RG, precisamos apenas dos 2 documentos principais.
              O tipo do documento será identificado automaticamente nesta etapa.
            </p>

            <label className="mt-5 block rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <span className="block text-sm font-black text-slate-900">
                {file ? file.name : "Clique para selecionar o arquivo"}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Aceitamos imagem ou PDF.
              </span>
            </label>

            {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
            {success && <p className="mt-3 text-sm font-bold text-green-600">{success}</p>}

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="mt-5 w-full rounded-xl bg-green-500 p-3 font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Enviando..." : `Enviar documento ${currentStep}/2`}
            </button>
          </div>
        )}

        {!uploadAllowed && !isWaiting && (
          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950">
            <h2 className="text-xl font-black">Upload indisponível</h2>
            <p className="mt-2 text-sm text-slate-600">
              O envio de documentos será liberado após a confirmação do pagamento.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}