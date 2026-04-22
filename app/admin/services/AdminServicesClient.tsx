"use client";

import { generateServiceData } from "@/lib/service-generator";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  codePrefix?: string | null;
};

function formatCurrencyInput(value: string) {
  const numeric = value.replace(/[^\d]/g, "");
  if (!numeric) return "";
  const numberValue = Number(numeric) / 100;
  return numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(value: string) {
  if (!value) return "";
  return value.replace(/\./g, "").replace(",", ".");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function normalizePrefix(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 10);
}

export default function AdminServicesClient({ user }: { user: User }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [codePrefix, setCodePrefix] = useState("");

  const servicesCountLabel = useMemo(() => {
    if (loadingServices) return "Carregando...";
    if (services.length === 0) return "Nenhum serviço";
    return `${services.length} serviços`;
  }, [loadingServices, services.length]);

  async function loadServices() {
    const res = await fetch("/api/services");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function refreshServices() {
    const next = await loadServices();
    setServices(next);
  }

  useEffect(() => {
    loadServices()
      .then(setServices)
      .finally(() => setLoadingServices(false));
  }, []);

async function handleCreateService(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const parsedPrice = parseCurrencyInput(price);

  if (!name || !parsedPrice) {
    alert("Preencha nome e preço.");
    return;
  }

  setSubmitting(true);

  try {
    const generated = generateServiceData(name);

    await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,

        // 🔥 descrição agora vira fallback (opcional)
        description: description || generated.highlights.join("\n"),

        price: parsedPrice,
        codePrefix: normalizePrefix(codePrefix),

        // 🚀 NOVO SISTEMA
        type: generated.type,
        highlights: generated.highlights,
        documents: generated.documents,
      }),
    });

    setName("");
    setDescription("");
    setPrice("");
    setCodePrefix("");

    await refreshServices();

  } catch (err) {
    alert("Erro ao criar serviço");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="px-4 py-6">
        <div className="mx-auto max-w-7xl">

          {/* HEADER */}
          <div className="mb-6 bg-white p-6 rounded-3xl shadow-sm">
            <h1 className="text-3xl font-bold">
              Gerenciar serviços
            </h1>

            <ul className="mt-3 max-w-md space-y-1 text-sm text-slate-600">
              <li>• Crie serviços com foco em conversão</li>
              <li>• Use descrição curta e direta</li>
              <li>• Evite textos longos</li>
            </ul>

            <div className="mt-3 text-sm text-slate-500">
              {servicesCountLabel}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">

            {/* CRIAR */}
            <section className="bg-white p-6 rounded-3xl">

              <h2 className="text-lg font-bold">
                Novo serviço
              </h2>

              <form onSubmit={handleCreateService} className="mt-4 space-y-4">

                <input
                  placeholder="Nome (ex: Regularizar CPF)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                />

                <textarea
                  placeholder={`Use frases curtas:
• Atendimento completo
• Suporte do início ao fim
• Processo simples`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 min-h-[120px]"
                />

                <input
                  placeholder="Preço (ex: 39,90)"
                  value={price}
                  onChange={(e) =>
                    setPrice(formatCurrencyInput(e.target.value))
                  }
                  className="w-full border rounded-xl px-4 py-3"
                />

                <input
                  placeholder="Prefixo (CPF, RG...)"
                  value={codePrefix}
                  onChange={(e) =>
                    setCodePrefix(normalizePrefix(e.target.value))
                  }
                  className="w-full border rounded-xl px-4 py-3 uppercase"
                />

                <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">
                  {submitting ? "Criando..." : "Criar serviço"}
                </button>

              </form>
            </section>

            {/* LISTA */}
            <section className="bg-white p-6 rounded-3xl">

              <h2 className="text-lg font-bold">
                Serviços
              </h2>

              <div className="mt-4 space-y-4">
                {services.map((s) => (
                  <div key={s.id} className="border rounded-2xl p-4">

                    <h3 className="font-bold">
                      {s.name}
                    </h3>

                    <ul className="mt-2 max-w-md space-y-1 text-sm text-slate-600">
                      {s.description.split("\n").map((line, i) => (
                        <li key={i}>• {line.replace(/^•\s?/, "")}</li>
                      ))}
                    </ul>

                    <div className="mt-3 font-bold">
                      {formatCurrency(s.price)}
                    </div>

                  </div>
                ))}
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  );
}