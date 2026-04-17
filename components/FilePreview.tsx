"use client";

import Image from "next/image";

type UploadedFile = {
  id: string;
  originalName: string;
  url: string;
  mimeType?: string;
};

export default function FilePreview({ file }: { file: UploadedFile }) {
  const isImage =
    file.mimeType === "image/jpeg" ||
    file.mimeType === "image/jpg" ||
    file.mimeType === "image/png";

  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="mt-3 rounded border bg-white p-4">
      <p className="mb-2 font-semibold">{file.originalName}</p>

      <div className="mb-3">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Abrir arquivo
        </a>
      </div>

      {isImage && (
        <div className="relative w-full overflow-hidden rounded border">
          <Image
            src={file.url}
            alt={file.originalName}
            width={1200}
            height={800}
            className="h-auto max-w-full rounded"
            unoptimized
          />
        </div>
      )}

      {isPdf && (
        <iframe
          src={file.url}
          title={file.originalName}
          className="h-[500px] w-full rounded border"
        />
      )}

      {!isImage && !isPdf && (
        <p className="text-sm text-gray-500">
          Pré-visualização não disponível para este tipo de arquivo.
        </p>
      )}
    </div>
  );
}