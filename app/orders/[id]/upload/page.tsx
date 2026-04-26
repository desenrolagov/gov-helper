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
  } | null;
  uploadedFiles?: UploadedFileItem[];
  serviceDocuments?: ServiceDocument[];
  requiredDocuments?: ServiceDocument[];
  businessHours?: {
    waitingForBusinessHours?: boolean;
  };
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

function getDocumentTypeLabel(type?: string | null) {
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

  const [uploadedTypes, setUploadedTypes] = useState<string[]>([]);
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

      setUploadedTypes(uploaded);

      const progressCalc = requiredDocuments.length
        ? Math.round((uploaded.length / requiredDocuments.length) * 100)
        : 0;

      setProgress(progressCalc);
    }

    load();
  }, [orderId, requiredDocuments.length]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const validation = validateFile(f);
    if (!validation.valid) {
      setError(validation.error || "Arquivo inválido.");
      return;
    }

    setFile(f);
  }

  async function handleUpload() {
    if (!file || !selectedType) return;

    setLoading(true);
    setError("");

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
      setError(data.error);
      setLoading(false);
      return;
    }

    setSuccess("Documento enviado com sucesso");
    setFile(null);
    setSelectedType("");

    router.refresh();
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-2xl font-black">
          Envio de documentos
        </h1>

        <p className="mt-2 text-sm text-white/70">
          {order?.service?.name}
        </p>

        <div className="mt-4 flex gap-3">
          <OrderCodeBadge code={order?.orderCode} />
          <span className="text-sm">{getStatusLabel(order?.status)}</span>
        </div>

        {/* PROGRESSO */}
        <div className="mt-6 h-3 bg-white/10 rounded-full">
          <div
            className="h-3 bg-[var(--accent-green)] rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* UPLOAD */}
        {uploadAllowed && (
          <div className="mt-6 space-y-3 bg-white p-5 text-black rounded-xl">

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full border p-2 rounded"
            >
              <option value="">Selecione</option>
              {serviceDocuments.map((doc) => (
                <option key={doc.key} value={doc.key}>
                  {doc.label}
                </option>
              ))}
            </select>

            <input type="file" onChange={handleFileChange} />

            <button
              onClick={handleUpload}
              className="w-full bg-[var(--accent-green)] text-white p-3 rounded"
            >
              {loading ? "Enviando..." : "Enviar documento"}
            </button>
          </div>
        )}

        {/* LISTA */}
        <div className="mt-6 bg-white text-black p-5 rounded-xl">
          <h2 className="font-bold">Arquivos enviados</h2>

          {(order?.uploadedFiles || []).map((f) => (
            <div key={f.id} className="mt-2 border p-3 rounded">
              <p>{f.originalName}</p>

              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Abrir
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}