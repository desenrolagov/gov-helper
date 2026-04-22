export function generateServiceData(name: string) {
  const lower = name.toLowerCase();

  // CPF
  if (lower.includes("cpf")) {
    return {
      type: "CPF",
      highlights: [
        "Regularização completa do CPF",
        "Suporte do início ao fim",
        "Processo rápido e sem burocracia",
      ],
      documents: [
        "Documento com foto",
        "Dados pessoais atualizados",
      ],
    };
  }

  // RG
  if (lower.includes("rg")) {
    return {
      type: "RG",
      highlights: [
        "Emissão ou 2ª via do RG",
        "Suporte completo durante o processo",
        "Orientação passo a passo",
      ],
      documents: [
        "Certidão de nascimento ou casamento",
        "CPF",
        "Documento antigo (se tiver)",
      ],
    };
  }

  // fallback
  return {
    type: "OUTRO",
    highlights: [
      "Atendimento completo",
      "Suporte especializado",
      "Processo simples",
    ],
    documents: [
      "Documentos básicos",
    ],
  };
}