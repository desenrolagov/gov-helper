"use client";

import { useEffect, useState } from "react";

type ResultFile = {
  id: string;
  originalName: string;
  savedName: string | null;
  mimeType: string | null;
  size: number | null;
  url: string;
  createdAt: string;
};

type Props = {
  orderId: string;
  title?: string;
  description?: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSize(size: number | null) {
  if (size == null) return "Tamanho não informado";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OrderResultFilesList({
  orderId,
  title = "Resultado final",
  description = "Quando o atendimento for concluído, os arquivos liberados aparecerão aqui.",
}: Props) {
  const [files, setFiles] = useState<ResultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFiles(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/orders/${orderId}/result-files`, {
        cache: "no-store",
        signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFiles([]);
        setError(
          data?.error || "Não foi possível carregar os arquivos liberados."
        );
        return;
      }

      setFiles(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error?.name === "AbortError") return;

      console.error("Erro ao carregar arquivos finais:", error);
      setFiles([]);
      setError("Erro inesperado ao carregar os arquivos liberados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    if (orderId) {
      loadFiles(controller.signal);
    } else {
      setFiles([]);
      setLoading(false);
      setError("Pedido não informado.");
    }

    return () => controller.abort();
  }, [orderId]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => loadFiles()}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Recarregar
        </button>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Carregando arquivos...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            Não foi possível carregar o resultado final
          </p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      ) : files.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-900">
            Nenhum arquivo final disponível até o momento.
          </p>
          <p className="mt-1">
            Assim que o atendimento for concluído, os arquivos liberados
            aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              Seu resultado final já está disponível.
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Você pode visualizar ou baixar os arquivos liberados abaixo.
            </p>
          </div>

          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {file.originalName || file.savedName || "Arquivo final"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Liberado em {formatDate(file.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatSize(file.size)}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ver arquivo
                  </a>

                  <a
                    href={`${file.url}${file.url.includes("?") ? "&" : "?"}download=1`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Baixar arquivo
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}