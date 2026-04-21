"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  currentStatus?: string | null;
  onUploaded?: () => void | Promise<void>;
};

type UploadResponse = {
  message?: string;
  error?: string;
  status?: string;
  file?: {
    id: string;
    originalName: string;
    url: string;
  };
};

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminFinalDeliveryCard({
  orderId,
  currentStatus,
  onUploaded,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCompleted = currentStatus === "COMPLETED";

  function resetInput() {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setError(
        `O arquivo excede o limite de ${MAX_FILE_SIZE_MB} MB. Selecione um arquivo menor.`
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setFile(selectedFile);
  }

  async function syncAfterAction() {
    if (onUploaded) {
      await onUploaded();
    }

    router.refresh();
  }

  async function handleUpload() {
    try {
      setError("");
      setSuccess("");

      if (!orderId) {
        setError("Pedido não informado.");
        return;
      }

      if (!file) {
        setError("Selecione um arquivo antes de enviar.");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/admin/orders/${orderId}/result-files`, {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Erro ao enviar arquivo final.");
        return;
      }

      setSuccess(
        data.message || "Arquivo final enviado com sucesso ao cliente."
      );

      resetInput();
      await syncAfterAction();
    } catch (error) {
      console.error("Erro ao enviar arquivo final:", error);
      setError("Erro inesperado ao enviar arquivo final.");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    try {
      setError("");
      setSuccess("");
      setCompleting(true);

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Não foi possível concluir o pedido.");
        return;
      }

      setSuccess("Pedido concluído com sucesso.");
      await syncAfterAction();
    } catch (error) {
      console.error("Erro ao concluir pedido:", error);
      setError("Erro inesperado ao concluir o pedido.");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Entrega final ao cliente
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Envie o arquivo final concluído para disponibilizar o resultado ao
            cliente.
          </p>
        </div>

        {isCompleted ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Pedido já concluído
          </span>
        ) : (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Etapa de entrega
          </span>
        )}
      </div>

      {isCompleted ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Este pedido já está marcado como concluído. Você ainda pode enviar
          novos arquivos finais, se necessário.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-900">
            Arquivo final
          </label>

          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            disabled={loading || completing}
            className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />

          <p className="mt-2 text-xs text-slate-500">
            Limite recomendado: até {MAX_FILE_SIZE_MB} MB por arquivo.
          </p>

          {file ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Tamanho: {formatSize(file.size)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading || completing}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar arquivo final"}
          </button>

          <button
            type="button"
            onClick={handleComplete}
            disabled={loading || completing}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {completing ? "Concluindo..." : "Concluir pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}