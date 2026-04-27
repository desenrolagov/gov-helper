// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertService(data: {
  name: string;
  description: string;
  price: number;
  type: string;
  codePrefix: string;
  active: boolean;
  requiresScheduleReview: boolean;
  highlights: string[];
  documents: string[];
}) {
  await prisma.service.upsert({
    where: {
      codePrefix: data.codePrefix,
    },
    update: data,
    create: data,
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

  console.log("✅ Serviços CPF e RG atualizados com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });