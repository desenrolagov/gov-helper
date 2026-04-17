export function getAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL não configurada em produção.");
    }

    return "http://localhost:3000";
  }

  const normalized = value.endsWith("/") ? value.slice(0, -1) : value;

  let parsed: URL;

  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL inválida.");
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL deve usar HTTPS em produção.");
  }

  return normalized;
}