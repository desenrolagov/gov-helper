"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  async function fetchServices() {
    try {
      setLoading(true);

      const res = await fetch("/api/services", {
        method: "GET",
        cache: "no-store",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      if (!res.ok) {
        alert(data.error || "Erro ao buscar serviços");
        setServices([]);
        return;
      }

      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      alert("Erro inesperado ao buscar serviços");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  async function handleCreateService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        alert(data.error || "Erro ao criar serviço");
        return;
      }

      alert("Serviço criado com sucesso");

      setName("");
      setDescription("");
      setPrice("");

      fetchServices();
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      alert("Erro inesperado ao criar serviço");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Gerenciar serviços</h1>
          <p className="text-gray-600 mt-2">
            Cadastre e acompanhe os serviços disponíveis no sistema.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Criar serviço</h2>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Segunda via do RG"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <textarea
                  placeholder="Descreva o serviço"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Preço</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 29.90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-2 text-white font-medium hover:bg-blue-700"
              >
                Criar serviço
              </button>
            </form>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Serviços cadastrados</h2>

            {loading ? (
              <p className="text-gray-500">Carregando serviços...</p>
            ) : services.length === 0 ? (
              <p className="text-gray-500">Nenhum serviço cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-xl p-4 bg-gray-50"
                  >
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <p className="text-gray-600 mt-1">{service.description}</p>
                    <p className="mt-2 font-medium">
                      R$ {service.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {service.active ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}