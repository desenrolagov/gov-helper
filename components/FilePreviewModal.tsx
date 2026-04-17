"use client";

import Image from "next/image";

type UploadedFile = {
  id: string;
  originalName: string;
  url: string;
  mimeType?: string;
};

type Props = {
  file: UploadedFile | null;
  open: boolean;
  onClose: () => void;
};

export default function FilePreviewModal({ file, open, onClose }: Props) {
  if (!open || !file) return null;

  const isImage =
    file.mimeType === "image/jpeg" ||
    file.mimeType === "image/jpg" ||
    file.mimeType === "image/png";

  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-bold">Visualizar arquivo</h2>
            <p className="text-sm text-gray-600">{file.originalName}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded border px-3 py-1 hover:bg-gray-100"
          >
            Fechar
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Abrir em nova aba
            </a>
          </div>

          {isImage && (
            <div className="flex justify-center">
              <Image
                src={file.url}
                alt={file.originalName}
                width={1400}
                height={1000}
                className="max-h-[70vh] w-auto rounded border"
                unoptimized
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={file.url}
              title={file.originalName}
              className="h-[70vh] w-full rounded border"
            />
          )}

          {!isImage && !isPdf && (
            <p className="text-sm text-gray-500">
              Pré-visualização não disponível para este tipo de arquivo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}