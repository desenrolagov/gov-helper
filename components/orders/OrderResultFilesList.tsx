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

  useEffect(() => {
    let isMounted = true;

    async function loadFiles() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/orders/${orderId}/result-files`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          if (!isMounted) return;
          setFiles([]);
          setError(
            data?.error || "Não foi possível carregar os arquivos liberados."
          );
          return;
        }

        if (!isMounted) return;
        setFiles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar arquivos finais:", error);

        if (!isMounted) return;
        setFiles([]);
        setError("Erro inesperado ao carregar os arquivos liberados.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (orderId) {
      loadFiles();
    } else {
      setFiles([]);
      setLoading(false);
      setError("Pedido não informado.");
    }

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Carregando arquivos...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            Não foi possível carregar o resultado final
          </p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-700">
            Nenhum arquivo final disponível até o momento.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Assim que o atendimento for concluído, os arquivos liberados
            aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              Seu resultado final já está disponível.
            </p>
            <p className="mt-1 text-sm text-green-700">
              Você pode visualizar ou baixar os arquivos liberados abaixo.
            </p>
          </div>

          {files.map((file) => (
            <div
              key={file.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {file.originalName || file.savedName || "Arquivo final"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Liberado em {formatDate(file.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatSize(file.size)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ver arquivo
                  </a>

                  <a
                    href={file.url}
                    download
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