import { prisma } from "@/lib/db";

/**
 * Normaliza nome do serviço (fallback)
 */
function normalizeServiceName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/**
 * Gera prefixo automático (fallback)
 */
function getKnownPrefix(serviceName: string) {
  const normalized = normalizeServiceName(serviceName);

  const rules: Array<{ match: RegExp; prefix: string }> = [
    { match: /\bCERTIDAO\b|\bCERTIDOES\b/, prefix: "CERT" },
    { match: /\bCPF\b/, prefix: "CPF" },
    { match: /\bCNH\b/, prefix: "CNH" },
    { match: /\bCNPJ\b/, prefix: "CNPJ" },
    { match: /\bRG\b/, prefix: "RG" },
    { match: /\bMEI\b/, prefix: "MEI" },
    { match: /\bANTECEDENTE\b|\bANTECEDENTES\b/, prefix: "ANT" },
    { match: /\bIRPF\b|\bIMPOSTO DE RENDA\b/, prefix: "IRPF" },
    { match: /\bTITULO DE ELEITOR\b|\bELEITORAL\b/, prefix: "TIT" },
  ];

  const found = rules.find((rule) => rule.match.test(normalized));
  if (found) return found.prefix;

  const words = normalized
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(
      (word) =>
        ![
          "DE",
          "DA",
          "DO",
          "DAS",
          "DOS",
          "PARA",
          "POR",
          "E",
          "EM",
        ].includes(word)
    );

  if (words.length === 0) return "SERV";

  if (words.length === 1) {
    return words[0].slice(0, 4).padEnd(4, "X");
  }

  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join("")
    .slice(0, 4)
    .padEnd(4, "X");
}

/**
 * Geração profissional de código de pedido
 */
export async function generateOrderCode(serviceId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar serviço
    const service = await tx.service.findUnique({
      where: { id: serviceId },
      select: {
        name: true,
        codePrefix: true,
      },
    });

    if (!service) {
      throw new Error("Serviço não encontrado");
    }

    // 2. Definir prefixo (manual OU automático)
    const prefix =
      service.codePrefix?.toUpperCase() ||
      getKnownPrefix(service.name);

    // 3. Buscar ou criar sequência
    let sequence = await tx.orderCodeSequence.findUnique({
      where: { prefix },
    });

    if (!sequence) {
      sequence = await tx.orderCodeSequence.create({
        data: {
          prefix,
          lastNumber: 0,
        },
      });
    }

    // 4. Incrementar contador
    const nextNumber = sequence.lastNumber + 1;

    await tx.orderCodeSequence.update({
      where: { prefix },
      data: { lastNumber: nextNumber },
    });

    // 5. Gerar código final
    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  });
}