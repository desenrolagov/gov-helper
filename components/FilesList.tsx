"use client";

import { useEffect, useState } from "react";
import FilePreviewModal from "@/components/FilePreviewModal";

type UploadedFile = {
  id: string;
  originalName: string;
  url: string;
  mimeType?: string;
  createdAt: string;
};

export default function FilesList({ orderId }: { orderId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);

        const res = await fetch(`/api/orders/${orderId}/files`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          console.error(data.error || "Erro ao carregar arquivos");
          setFiles([]);
          return;
        }

        setFiles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar arquivos:", error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [orderId]);

  function handleOpenPreview(file: UploadedFile) {
    setSelectedFile(file);
    setModalOpen(true);
  }

  function handleClosePreview() {
    setModalOpen(false);
    setSelectedFile(null);
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando arquivos...</p>;
  }

  if (files.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum arquivo enviado.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      <h3 className="font-bold text-lg">Documentos enviados</h3>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg p-3 bg-white flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{file.originalName}</p>
              <p className="text-sm text-gray-500">
                Enviado em {new Date(file.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenPreview(file)}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Visualizar
              </button>

              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded border hover:bg-gray-50"
              >
                Abrir
              </a>
            </div>
          </div>
        ))}
      </div>

      <FilePreviewModal
        file={selectedFile}
        open={modalOpen}
        onClose={handleClosePreview}
      />
    </div>
  );
}