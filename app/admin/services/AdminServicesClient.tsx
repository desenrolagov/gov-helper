"use client";

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
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return normalized;
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCodePrefix, setEditCodePrefix] = useState("");

  const servicesCountLabel = useMemo(() => {
    if (loadingServices) return "Carregando serviços...";
    if (services.length === 0) return "Nenhum serviço cadastrado";
    if (services.length === 1) return "1 serviço cadastrado";
    return `${services.length} serviços cadastrados`;
  }, [loadingServices, services.length]);

  async function loadServices() {
    const res = await fetch("/api/services", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao buscar serviços");
    }

    return Array.isArray(data) ? (data as Service[]) : [];
  }

  async function refreshServices(showAlert = false) {
    try {
      const nextServices = await loadServices();
      setServices(nextServices);

      if (showAlert) {
        alert("Lista de serviços atualizada.");
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      alert("Erro ao buscar serviços.");
    }
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const nextServices = await loadServices();

        if (!active) return;
        setServices(nextServices);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        if (active) {
          alert("Erro ao carregar serviços.");
        }
      } finally {
        if (active) {
          setLoadingServices(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateService(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const normalizedPrefix = normalizePrefix(codePrefix);
    const parsedPrice = parseCurrencyInput(price);

    if (!name.trim()) {
      alert("Informe o nome do serviço.");
      return;
    }

    if (!description.trim()) {
      alert("Informe a descrição do serviço.");
      return;
    }

    if (!parsedPrice || Number(parsedPrice) <= 0) {
      alert("Informe um preço válido.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/services", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: parsedPrice,
          codePrefix: normalizedPrefix,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao criar serviço");
        return;
      }

      setName("");
      setDescription("");
      setPrice("");
      setCodePrefix("");

      await refreshServices();
      alert("Serviço criado com sucesso.");
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      alert("Erro inesperado ao criar serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(service: Service) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditDescription(service.description);
    setEditPrice(
      Number(service.price).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setEditCodePrefix(service.codePrefix || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditPrice("");
    setEditCodePrefix("");
  }

  async function handleUpdateService(serviceId: string) {
    const normalizedPrefix = normalizePrefix(editCodePrefix);
    const parsedPrice = parseCurrencyInput(editPrice);

    if (!editName.trim()) {
      alert("Informe o nome do serviço.");
      return;
    }

    if (!editDescription.trim()) {
      alert("Informe a descrição do serviço.");
      return;
    }

    if (!parsedPrice || Number(parsedPrice) <= 0) {
      alert("Informe um preço válido.");
      return;
    }

    try {
      setSavingEdit(true);

      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          price: parsedPrice,
          codePrefix: normalizedPrefix,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao atualizar serviço");
        return;
      }

      cancelEditing();
      await refreshServices();
      alert("Serviço atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      alert("Erro inesperado ao atualizar serviço.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este serviço?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(serviceId);

      const res = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao excluir serviço");
        return;
      }

      await refreshServices();
      alert("Serviço excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      alert("Erro inesperado ao excluir serviço.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav user={user} />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Painel administrativo
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Gerenciar serviços
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  Cadastre, edite e organize os serviços oferecidos pela
                  DesenrolaGov. Esta área controla o catálogo que aparece na
                  plataforma e impacta diretamente a contratação dos clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[360px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Catálogo atual
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {servicesCountLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Acesso
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    Administrador
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Criar novo serviço
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Cadastre um serviço com nome claro, descrição objetiva, preço
                correto e prefixo para organização interna.
              </p>

              <form onSubmit={handleCreateService} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="service-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nome do serviço
                  </label>
                  <input
                    id="service-name"
                    type="text"
                    placeholder="Ex: Regularização de CPF"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service-description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Descrição
                  </label>
                  <textarea
                    id="service-description"
                    placeholder="Descreva o serviço, o objetivo e o que o cliente deve entender antes de contratar."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="min-h-[150px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="service-price"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Preço
                    </label>
                    <input
                      id="service-price"
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={price}
                      onChange={(e) =>
                        setPrice(formatCurrencyInput(e.target.value))
                      }
                      required
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="service-prefix"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Prefixo do serviço
                    </label>
                    <input
                      id="service-prefix"
                      type="text"
                      placeholder="Ex: CPF"
                      value={codePrefix}
                      onChange={(e) =>
                        setCodePrefix(normalizePrefix(e.target.value))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Dica de estrutura
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Use um nome comercial direto, uma descrição clara e um
                    prefixo curto como CPF, CNH, CERT ou MEI para padronizar os
                    pedidos.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Criando serviço..." : "Criar serviço"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Serviços cadastrados
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Edite ou remova serviços já criados no sistema.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => refreshServices(true)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Atualizar lista
                </button>
              </div>

              <div className="mt-6">
                {loadingServices ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Carregando serviços...
                  </div>
                ) : services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-base font-semibold text-slate-900">
                      Nenhum serviço cadastrado
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Cadastre o primeiro serviço para ele aparecer no catálogo
                      da plataforma.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                      >
                        {editingId === service.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Nome
                              </label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Descrição
                              </label>
                              <textarea
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                                className="min-h-[130px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                              />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  Preço
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editPrice}
                                  onChange={(e) =>
                                    setEditPrice(
                                      formatCurrencyInput(e.target.value)
                                    )
                                  }
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  Prefixo
                                </label>
                                <input
                                  type="text"
                                  value={editCodePrefix}
                                  onChange={(e) =>
                                    setEditCodePrefix(
                                      normalizePrefix(e.target.value)
                                    )
                                  }
                                  placeholder="Ex: CPF"
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateService(service.id)
                                }
                                disabled={savingEdit}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingEdit ? "Salvando..." : "Salvar alterações"}
                              </button>

                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-semibold text-slate-900">
                                    {service.name}
                                  </h3>

                                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                    {service.codePrefix || "SEM PREFIXO"}
                                  </span>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                  {service.description}
                                </p>
                              </div>

                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                  Preço
                                </p>
                                <p className="mt-1 text-lg font-bold text-slate-900">
                                  {formatCurrency(service.price)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                              <button
                                type="button"
                                onClick={() => startEditing(service)}
                                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                Editar serviço
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteService(service.id)}
                                disabled={deletingId === service.id}
                                className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === service.id
                                  ? "Excluindo..."
                                  : "Excluir serviço"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}