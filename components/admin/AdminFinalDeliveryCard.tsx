"use client";

import { useRef, useState } from "react";

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

export default function AdminFinalDeliveryCard({
  orderId,
  currentStatus,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isCompleted = currentStatus === "COMPLETED";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
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

      const data: UploadResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar arquivo final.");
        return;
      }

      setSuccess(
        data.message || "Arquivo final enviado com sucesso ao cliente."
      );
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      if (onUploaded) {
        await onUploaded();
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo final:", error);
      setError("Erro inesperado ao enviar arquivo final.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Entrega final ao cliente
        </h2>
        <p className="text-sm text-slate-600">
          Envie o arquivo final concluído para disponibilizar o resultado ao
          cliente.
        </p>
      </div>

      {isCompleted ? (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Este pedido já está marcado como concluído. Você ainda pode enviar
          novos arquivos finais, se necessário.
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Arquivo final
          </label>

          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />
        </div>

        {file ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Arquivo selecionado: <strong>{file.name}</strong>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar arquivo final"}
        </button>
      </div>
    </section>
  );
}