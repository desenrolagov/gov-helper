import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Evita duplicar
  const existing = await prisma.service.findFirst({
    where: {
      codePrefix: "RG",
    },
  });

  if (existing) {
    console.log("⚠️ Serviço RG já existe.");
    return;
  }

  await prisma.service.create({
    data: {
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
      documents: [
        "Documento com foto",
        "Comprovante de residência",
        "CPF",
      ],
    },
  });

  console.log("✅ Serviço RG criado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });