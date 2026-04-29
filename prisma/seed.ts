// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ServiceSeed = {
  name: string;
  description: string;
  price: number;
  type: string;
  codePrefix: string;
  active: boolean;
  requiresScheduleReview: boolean;
  highlights: string[];
  documents: string[];
};

async function upsertService(data: ServiceSeed) {
  await prisma.service.upsert({
    where: {
      codePrefix: data.codePrefix,
    },
    update: {
      name: data.name,
      description: data.description,
      price: data.price,
      type: data.type,
      codePrefix: data.codePrefix,
      active: data.active,
      requiresScheduleReview: data.requiresScheduleReview,
      highlights: data.highlights,
      documents: data.documents,
    },
    create: {
      name: data.name,
      description: data.description,
      price: data.price,
      type: data.type,
      codePrefix: data.codePrefix,
      active: data.active,
      requiresScheduleReview: data.requiresScheduleReview,
      highlights: data.highlights,
      documents: data.documents,
    },
  });
}

async function main() {
  await upsertService({
    name: "Regularização de CPF na Receita Federal",
    description:
      "Assessoria privada para orientar e acompanhar a regularização do CPF, com conferência de documentos e suporte durante o processo.",
    price: 39.9,
    type: "CPF",
    codePrefix: "CPF",
    active: true,
    requiresScheduleReview: false,
    highlights: [
      "Atendimento rápido e orientado",
      "Conferência dos documentos",
      "Acompanhamento do pedido",
    ],
    documents: ["CPF", "Documento com foto", "Comprovante de residência"],
  });

  await upsertService({
    name: "Agendamento RG 2ª via Poupatempo",
    description:
      "Assessoria privada para organização de documentos e agendamento presencial no Poupatempo para foto e biometria.",
    price: 39.9,
    type: "RG",
    codePrefix: "RG",
    active: true,
    requiresScheduleReview: true,
    highlights: [
      "Agendamento rápido no Poupatempo",
      "Orientação completa",
      "Suporte até o atendimento presencial",
    ],
    documents: ["Documento com foto", "Comprovante de residência", "CPF"],
  });

  await upsertService({
    name: "Abertura de MEI com assessoria",
    description:
      "Assessoria privada para abertura de MEI, com suporte no preenchimento dos dados, escolha da atividade e orientação inicial.",
    price: 49.9,
    type: "MEI",
    codePrefix: "MEI",
    active: true,
    requiresScheduleReview: false,
    highlights: [
      "Abertura do MEI com orientação",
      "Ajuda na escolha da atividade",
      "Entrega do CNPJ e certificado MEI",
    ],
    documents: [],
  });

  console.log("✅ Serviços CPF, RG e MEI atualizados com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao rodar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });