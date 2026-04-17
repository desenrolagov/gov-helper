import { prisma } from "@/lib/db";

export type DocumentKey =
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
  | "CPF_REGULARIZATION"
  | "CNH_SECOND_COPY"
  | "NEGATIVE_CERTIFICATE"
  | "MEI_REGULARIZATION";

export type ServiceDocument = {
  key: DocumentKey;
  label: string;
  required: boolean;
};

export type ServiceResolverInput = {
  id?: string | null;
  name?: string | null;
  codePrefix?: string | null;
};

export const SERVICE_REQUIRED_DOCUMENTS: Record<ServiceType, ServiceDocument[]> = {
  CPF_REGULARIZATION: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto (RG ou CNH)",
      required: true,
    },
    {
      key: "SELFIE_COM_DOCUMENTO",
      label: "Selfie segurando o documento",
      required: true,
    },
    {
      key: "COMPROVANTE_CPF",
      label: "Comprovante de situação do CPF ou print da pendência",
      required: true,
    },
    {
      key: "CERTIDAO_CIVIL",
      label: "Certidão de nascimento ou casamento",
      required: false,
    },
    {
      key: "COMPROVANTE_ENDERECO",
      label: "Comprovante de endereço",
      required: false,
    },
  ],

  CNH_SECOND_COPY: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
    },
    {
      key: "CNH_ATUAL",
      label: "Foto ou cópia da CNH atual, se possuir",
      required: false,
    },
    {
      key: "BOLETIM_OCORRENCIA",
      label: "Boletim de ocorrência, se houve perda/roubo",
      required: false,
    },
    {
      key: "COMPROVANTE_ENDERECO",
      label: "Comprovante de endereço",
      required: true,
    },
    {
      key: "COMPROVANTE_PAGAMENTO_GUIA",
      label: "Comprovante da guia, se já tiver pago",
      required: false,
    },
  ],

  NEGATIVE_CERTIFICATE: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
    },
    {
      key: "COMPROVANTE_CPF",
      label: "CPF ou comprovante de inscrição",
      required: true,
    },
    {
      key: "CERTIDAO_NEGATIVA_BASE",
      label: "Documento ou print da exigência / certidão anterior",
      required: false,
    },
  ],

  MEI_REGULARIZATION: [
    {
      key: "DOCUMENTO_FOTO",
      label: "Documento com foto",
      required: true,
    },
    {
      key: "COMPROVANTE_CNPJ",
      label: "Cartão CNPJ ou comprovante do MEI",
      required: true,
    },
    {
      key: "DOCUMENTO_EMPRESA",
      label: "Documento ou print da pendência da empresa",
      required: true,
    },
    {
      key: "COMPROVANTE_ENDERECO",
      label: "Comprovante de endereço",
      required: false,
    },
    {
      key: "COMPROVANTE_MEI",
      label: "Comprovante DASN/SIMEI ou DAS, se tiver",
      required: false,
    },
  ],
};

type DynamicRequiredDoc = {
  key: string;
  label: string;
  required?: boolean;
};

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function isKnownDocumentKey(value: string): value is DocumentKey {
  return getAllDocumentKeys().includes(value as DocumentKey);
}

function normalizeDynamicRequiredDocs(value: unknown): ServiceDocument[] | null {
  if (!Array.isArray(value)) return null;

  const docs: ServiceDocument[] = [];

  for (const item of value as DynamicRequiredDoc[]) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.key !== "string" || typeof item.label !== "string") continue;
    if (!isKnownDocumentKey(item.key)) continue;

    docs.push({
      key: item.key,
      label: item.label,
      required: item.required !== false,
    });
  }

  return docs.length > 0 ? docs : null;
}

export function getAllDocumentKeys(): DocumentKey[] {
  return [
    ...new Set(
      Object.values(SERVICE_REQUIRED_DOCUMENTS).flatMap((docs) =>
        docs.map((doc) => doc.key)
      )
    ),
  ];
}

export function getServiceDocuments(serviceType: ServiceType): ServiceDocument[] {
  return SERVICE_REQUIRED_DOCUMENTS[serviceType];
}

export function getRequiredDocumentsForService(
  serviceType: ServiceType
): ServiceDocument[] {
  return SERVICE_REQUIRED_DOCUMENTS[serviceType].filter((doc) => doc.required);
}

export async function getServiceDocumentsDynamic(
  serviceId: string,
  fallbackServiceType?: ServiceType
): Promise<ServiceDocument[]> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      requiredDocs: true,
    },
  });

  const dynamicDocs = normalizeDynamicRequiredDocs(service?.requiredDocs);

  if (dynamicDocs) {
    return dynamicDocs;
  }

  return getServiceDocuments(fallbackServiceType || "CPF_REGULARIZATION");
}

export async function getRequiredDocumentsForServiceDynamic(
  serviceId: string,
  fallbackServiceType?: ServiceType
): Promise<ServiceDocument[]> {
  const docs = await getServiceDocumentsDynamic(serviceId, fallbackServiceType);
  return docs.filter((doc) => doc.required);
}

export function isValidDocumentType(type: string): type is DocumentKey {
  return getAllDocumentKeys().includes(type as DocumentKey);
}

export function isDocumentAllowedForService(
  serviceType: ServiceType,
  type: string
): type is DocumentKey {
  return getServiceDocuments(serviceType).some((doc) => doc.key === type);
}

export async function isDocumentAllowedForServiceDynamic(
  serviceId: string,
  type: string,
  fallbackServiceType?: ServiceType
): Promise<boolean> {
  const docs = await getServiceDocumentsDynamic(serviceId, fallbackServiceType);
  return docs.some((doc) => doc.key === type);
}

export function resolveServiceTypeFromService(
  service?: ServiceResolverInput | null
): ServiceType {
  const prefix = normalizeText(service?.codePrefix);
  const name = normalizeText(service?.name);

  if (prefix === "CPF") return "CPF_REGULARIZATION";
  if (prefix === "CNH") return "CNH_SECOND_COPY";
  if (prefix === "CERT" || prefix === "CNT") return "NEGATIVE_CERTIFICATE";
  if (prefix === "MEI") return "MEI_REGULARIZATION";

  if (name.includes("CPF")) return "CPF_REGULARIZATION";
  if (name.includes("CNH")) return "CNH_SECOND_COPY";
  if (name.includes("CERTIDAO") || name.includes("CERTIDÃO")) {
    return "NEGATIVE_CERTIFICATE";
  }
  if (name.includes("MEI")) return "MEI_REGULARIZATION";

  return "CPF_REGULARIZATION";
}