import { prisma } from "@/lib/db";

export type DocumentKey =
  | "rg"
  | "cpf"
  | "CPF"
  | "comprovante_residencia"
  | "selfie_documento"
  | "certidao_nascimento"
  | "certidao_casamento"
  | "documento_adicional"
  | "DOCUMENTO_ADICIONAL"
  | "documento_com_foto"
  | "comprovante_cpf"
  | "DOCUMENTO_FOTO"
  | "SELFIE_COM_DOCUMENTO"
  | "CERTIDAO_CIVIL"
  | "COMPROVANTE_ENDERECO"
  | "COMPROVANTE_CPF"
  | "CNH_ATUAL"
  | "BOLETIM_OCORRENCIA"
  | "COMPROVANTE_PAGAMENTO_GUIA"
  | "CERTIDAO_NEGATIVA_BASE"
  | "DOCUMENTO_EMPRESA"
  | "COMPROVANTE_CNPJ"
  | "COMPROVANTE_MEI";

export type ServiceType =
  | "CPF"
  | "RG"
  | "CNH"
  | "CERTIDAO"
  | "CNPJ"
  | "MEI"
  | "OUTRO";

export type ServiceDocument = {
  key: DocumentKey;
  label: string;
  required: boolean;
  description?: string;
};

type MinimalService = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  codePrefix?: string | null;
  documents?: unknown;
};

const DEFAULT_DOCUMENTS_BY_TYPE: Record<ServiceType, ServiceDocument[]> = {
  CPF: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
      description: "RG ou CNH legível, frente e verso.",
    },
    {
      key: "SELFIE_COM_DOCUMENTO",
      label: "Selfie com documento",
      required: true,
      description: "Foto segurando o documento ao lado do rosto.",
    },
    {
      key: "COMPROVANTE_CPF",
      label: "Comprovante da situação do CPF",
      required: true,
      description: "Print ou comprovante da pendência/irregularidade.",
    },
    {
      key: "COMPROVANTE_ENDERECO",
      label: "Comprovante de endereço",
      required: false,
      description: "Conta recente ou documento equivalente.",
    },
  ],
RG: [
  {
    key: "CPF",
    label: "CPF ou certidão de nascimento",
    required: true,
    description: "Envie o CPF ou a certidão de nascimento/casamento legível.",
  },
  {
    key: "COMPROVANTE_ENDERECO",
    label: "Comprovante de residência",
    required: true,
    description: "Conta recente de água, luz, telefone, internet ou documento equivalente.",
  },
],
  CNH: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
      description: "RG ou documento equivalente.",
    },
    {
      key: "CNH_ATUAL",
      label: "CNH atual",
      required: false,
      description: "Foto ou cópia da CNH atual, se tiver.",
    },
    {
      key: "COMPROVANTE_ENDERECO",
      label: "Comprovante de endereço",
      required: true,
      description: "Conta recente ou documento equivalente.",
    },
    {
      key: "BOLETIM_OCORRENCIA",
      label: "Boletim de ocorrência",
      required: false,
      description: "Quando houver perda, furto ou extravio.",
    },
  ],
  CERTIDAO: [
    {
      key: "CERTIDAO_NEGATIVA_BASE",
      label: "Documento base da certidão",
      required: true,
      description: "Informações ou documento base para emissão.",
    },
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
      description: "Documento legível do solicitante.",
    },
  ],
  CNPJ: [
    {
      key: "DOCUMENTO_EMPRESA",
      label: "Documento da empresa",
      required: true,
      description: "Contrato, requerimento ou documento equivalente.",
    },
    {
      key: "COMPROVANTE_CNPJ",
      label: "Comprovante do CNPJ",
      required: true,
      description: "Cartão CNPJ ou consulta equivalente.",
    },
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
      description: "Documento do responsável.",
    },
  ],
  MEI: [
    {
      key: "COMPROVANTE_MEI",
      label: "Comprovante do MEI",
      required: true,
      description: "CCMEI ou documento equivalente.",
    },
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
      description: "Documento do titular.",
    },
    {
      key: "COMPROVANTE_ENDERECO",
      label: "Comprovante de endereço",
      required: false,
      description: "Conta recente ou documento equivalente.",
    },
  ],
  OUTRO: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
      description: "Documento legível do cliente.",
    },
    {
      key: "DOCUMENTO_ADICIONAL",
      label: "Documento adicional",
      required: false,
      description: "Outros arquivos necessários para o atendimento.",
    },
  ],
};

function normalizeDocumentKey(value: string): DocumentKey {
  const normalized = value.trim();

  const allowed = new Set<string>([
    "rg",
    "cpf",
    "CPF",
    "comprovante_residencia",
    "selfie_documento",
    "certidao_nascimento",
    "certidao_casamento",
    "documento_adicional",
    "DOCUMENTO_ADICIONAL",
    "documento_com_foto",
    "comprovante_cpf",
    "DOCUMENTO_FOTO",
    "SELFIE_COM_DOCUMENTO",
    "CERTIDAO_CIVIL",
    "COMPROVANTE_ENDERECO",
    "COMPROVANTE_CPF",
    "CNH_ATUAL",
    "BOLETIM_OCORRENCIA",
    "COMPROVANTE_PAGAMENTO_GUIA",
    "CERTIDAO_NEGATIVA_BASE",
    "DOCUMENTO_EMPRESA",
    "COMPROVANTE_CNPJ",
    "COMPROVANTE_MEI",
  ]);

  if (allowed.has(normalized)) {
    return normalized as DocumentKey;
  }

  return "documento_adicional";
}

function normalizeServiceType(value?: string | null): ServiceType {
  const normalized = (value || "").trim().toUpperCase();

  if (
    normalized === "CPF" ||
    normalized === "RG" ||
    normalized === "CNH" ||
    normalized === "CERTIDAO" ||
    normalized === "CNPJ" ||
    normalized === "MEI"
  ) {
    return normalized;
  }

  return "OUTRO";
}

export function resolveServiceTypeFromService(
  service?: MinimalService | null
): ServiceType {
  if (!service) return "OUTRO";

  if (service.type) {
    return normalizeServiceType(service.type);
  }

  const name = (service.name || "").toLowerCase();

  if (name.includes("cpf")) return "CPF";
  if (name.includes("rg")) return "RG";
  if (name.includes("cnh")) return "CNH";
  if (name.includes("certidão") || name.includes("certidao")) return "CERTIDAO";
  if (name.includes("cnpj")) return "CNPJ";
  if (name.includes("mei")) return "MEI";

  return "OUTRO";
}

function normalizeDocumentsInput(
  documents: unknown,
  serviceType: ServiceType
): ServiceDocument[] {
  if (!Array.isArray(documents)) {
    return DEFAULT_DOCUMENTS_BY_TYPE[serviceType];
  }

  const normalized = documents
    .map((item) => {
      if (typeof item === "string") {
        return {
          key: normalizeDocumentKey(item),
          label: item,
          required: true,
        } satisfies ServiceDocument;
      }

      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const rawKey =
          typeof obj.key === "string"
            ? obj.key
            : typeof obj.type === "string"
            ? obj.type
            : "documento_adicional";

        const rawLabel =
          typeof obj.label === "string"
            ? obj.label
            : typeof obj.name === "string"
            ? obj.name
            : rawKey;

        return {
          key: normalizeDocumentKey(rawKey),
          label: rawLabel.trim(),
          required:
            typeof obj.required === "boolean" ? obj.required : true,
          description:
            typeof obj.description === "string"
              ? obj.description.trim()
              : undefined,
        } satisfies ServiceDocument;
      }

      return null;
    })
    .filter((item): item is ServiceDocument => Boolean(item));

  if (!normalized.length) {
    return DEFAULT_DOCUMENTS_BY_TYPE[serviceType];
  }

  const unique = new Map<string, ServiceDocument>();

  for (const doc of normalized) {
    if (!unique.has(doc.key)) {
      unique.set(doc.key, doc);
    }
  }

  return [...unique.values()];
}

export function getServiceDocuments(
  serviceType?: ServiceType | null
): ServiceDocument[] {
  return (
    DEFAULT_DOCUMENTS_BY_TYPE[serviceType || "OUTRO"] ||
    DEFAULT_DOCUMENTS_BY_TYPE.OUTRO
  );
}

export function getRequiredDocumentsForService(
  serviceType?: ServiceType | null
): ServiceDocument[] {
  return getServiceDocuments(serviceType).filter((doc) => doc.required);
}

export async function getServiceDocumentsDynamic(
  serviceId: string,
  fallbackServiceType?: ServiceType | null
): Promise<ServiceDocument[]> {
  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        type: true,
        documents: true,
      },
    });

    const resolvedType = resolveServiceTypeFromService({
      ...service,
      type: service?.type || fallbackServiceType || "OUTRO",
    });

    if (!service) {
      return getServiceDocuments(resolvedType);
    }

    return normalizeDocumentsInput(service.documents, resolvedType);
  } catch (error) {
    console.error("Erro ao buscar documentos dinâmicos do serviço:", error);
    return getServiceDocuments(fallbackServiceType || "OUTRO");
  }
}

export async function getRequiredDocumentsForServiceDynamic(
  serviceId: string,
  fallbackServiceType?: ServiceType | null
): Promise<ServiceDocument[]> {
  const documents = await getServiceDocumentsDynamic(
    serviceId,
    fallbackServiceType
  );
  return documents.filter((doc) => doc.required);
}

export async function isDocumentAllowedForServiceDynamic(
  serviceId: string,
  fallbackServiceType: ServiceType | null,
  type: string
): Promise<boolean> {
  const docs = await getServiceDocumentsDynamic(serviceId, fallbackServiceType);
  return docs.some((doc) => doc.key === type);
}

export function isValidDocumentType(type: string): boolean {
  const normalized = normalizeDocumentKey(type);
  return Boolean(normalized);
}