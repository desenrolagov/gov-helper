import path from "path";

export function buildSafeFileName(
  originalName: string,
  fallbackBaseName = "arquivo"
) {
  const extension = path.extname(originalName).toLowerCase() || ".bin";

  const baseName = path
    .basename(originalName, extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${baseName || fallbackBaseName}-${Date.now()}${extension}`;
}