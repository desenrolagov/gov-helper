import { headers } from "next/headers";

export async function getAppUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (envUrl) {
    const normalized = envUrl.endsWith("/")
      ? envUrl.slice(0, -1)
      : envUrl;

    try {
      const parsed = new URL(normalized);

      if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
        throw new Error("NEXT_PUBLIC_APP_URL deve usar HTTPS em produção.");
      }

      return normalized;
    } catch {
      throw new Error("NEXT_PUBLIC_APP_URL inválida.");
    }
  }

  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) {
    throw new Error("Não foi possível determinar o host da aplicação.");
  }

  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";

  return `${protocol}://${host}`;
}