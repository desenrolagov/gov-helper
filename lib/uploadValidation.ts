const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Tipo de arquivo não permitido. Envie PDF, PNG ou JPG.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "Arquivo excede o limite de 10MB.",
    };
  }

  return {
    valid: true,
  };
}