"use client";

import { useState } from "react";
import { validateFile } from "@/lib/uploadValidation";

export default function UploadDocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");

    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      setFile(null);
      setError(validation.error || "Arquivo inválido.");
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    setError("");
    setSuccess("");

    if (!file) {
      setError("Selecione um arquivo antes de enviar.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erro ao enviar arquivo.");
      return;
    }

    setSuccess("Arquivo enviado com sucesso.");
    setFile(null);
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold mb-4">Upload de Documento</h1>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="mb-4"
      />

      {error && <p className="text-red-600 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Enviar
      </button>
    </div>
  );
}