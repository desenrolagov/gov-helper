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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    const res = await fetch("/api/services", { cache: "no-store" });
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

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setCodePrefix("");
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setName(service.name);
    setDescription(service.description || "");
    setPrice(formatCurrencyInput(String(Math.round(Number(service.price) * 100))));
    setCodePrefix(service.codePrefix || "");
  }

  async function handleSubmitService(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const parsedPrice = parseCurrencyInput(price);

    if (!name || !parsedPrice) {
      alert("Preencha nome e preço.");
      return;
    }

    setSubmitting(true);

    try {
      const generated = generateServiceData(name);

      const payload = {
        name,
        description: description || generated.highlights.join("\n"),
        price: parsedPrice,
        codePrefix: normalizePrefix(codePrefix),
        type: generated.type,
        highlights: generated.highlights,
        documents: generated.documents,
      };

      const url = editingId ? `/api/services/${editingId}` : "/api/services";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Erro ao salvar serviço.");
        return;
      }

      resetForm();
      await refreshServices();
    } catch {
      alert("Erro ao salvar serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este serviço? Essa ação pode afetar o catálogo."
    );

    if (!confirmed) return;

    try {
      setDeletingId(serviceId);

      const res = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Erro ao excluir serviço.");
        return;
      }

      if (editingId === serviceId) resetForm();

      await refreshServices();
    } catch {
      alert("Erro inesperado ao excluir serviço.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-6 rounded-3xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20">
            <div className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-xs font-bold text-green-300">
              Painel administrativo
            </div>

            <h1 className="mt-4 text-3xl font-black">
              Gerenciar serviços
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
              Crie, edite e remova serviços da plataforma. Mantenha nomes,
              valores e descrições claros para melhorar a conversão.
            </p>

            <div className="mt-4 text-sm font-bold text-green-300">
              {servicesCountLabel}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
              <h2 className="text-lg font-black text-slate-950">
                {editingId ? "Editar serviço" : "Novo serviço"}
              </h2>

              <form onSubmit={handleSubmitService} className="mt-4 space-y-4">
                <input
                  placeholder="Nome (ex: Regularizar CPF)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--accent-green)]"
                />

                <textarea
                  placeholder={`Use frases curtas:
• Atendimento completo
• Suporte do início ao fim
• Processo simples`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--accent-green)]"
                />

                <input
                  placeholder="Preço (ex: 39,90)"
                  value={price}
                  onChange={(e) => setPrice(formatCurrencyInput(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[var(--accent-green)]"
                />

                <input
                  placeholder="Prefixo (CPF, RG...)"
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(normalizePrefix(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-[var(--accent-green)]"
                />

                <button
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--accent-green)] py-3 font-bold text-white hover:bg-[var(--accent-green-hover)] disabled:opacity-60"
                >
                  {submitting
                    ? "Salvando..."
                    : editingId
                    ? "Salvar alterações"
                    : "Criar serviço"}
                </button>

                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full rounded-xl border border-slate-300 py-3 font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </form>
            </section>

            <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
              <h2 className="text-lg font-black text-slate-950">
                Serviços cadastrados
              </h2>

              <div className="mt-4 space-y-4">
                {loadingServices ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    Carregando serviços...
                  </div>
                ) : services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    Nenhum serviço cadastrado.
                  </div>
                ) : (
                  services.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-black text-slate-950">
                            {service.name}
                          </h3>

                          <ul className="mt-2 max-w-md space-y-1 text-sm text-slate-600">
                            {(service.description || "")
                              .split("\n")
                              .filter(Boolean)
                              .map((line, index) => (
                                <li key={index}>
                                  • {line.replace(/^•\s?/, "")}
                                </li>
                              ))}
                          </ul>

                          <div className="mt-3 text-lg font-black text-slate-950">
                            {formatCurrency(service.price)}
                          </div>

                          {service.codePrefix ? (
                            <div className="mt-2 text-xs font-bold text-slate-500">
                              Prefixo: {service.codePrefix}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-2 sm:w-40">
                          <button
                            type="button"
                            onClick={() => startEdit(service)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteService(service.id)}
                            disabled={deletingId === service.id}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === service.id ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}