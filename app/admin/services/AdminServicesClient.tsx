"use client";

import { FormEvent, useEffect, useState } from "react";
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

export default function AdminServicesClient({ user }: { user: User }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [codePrefix, setCodePrefix] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCodePrefix, setEditCodePrefix] = useState("");

  async function loadServices() {
    const res = await fetch("/api/services", {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao buscar serviços");
    }

    return Array.isArray(data) ? (data as Service[]) : [];
  }

  async function refreshServices() {
    try {
      const nextServices = await loadServices();
      setServices(nextServices);
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

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          price,
          codePrefix,
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
    }
  }

  function startEditing(service: Service) {
    setEditingId(service.id);
    setEditName(service.name);
    setEditDescription(service.description);
    setEditPrice(String(service.price));
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
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          price: editPrice,
          codePrefix: editCodePrefix,
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
    }
  }

  async function handleDeleteService(serviceId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este serviço?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
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
    }
  }

  return (
    <div>
      <AppNav user={user} />

      <main style={{ padding: "24px" }}>
        <h1>Gerenciar serviços</h1>

        <form onSubmit={handleCreateService} style={{ marginBottom: "32px" }}>
          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Nome do serviço"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <textarea
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="number"
              placeholder="Preço"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Prefixo do serviço (ex: CPF, CNH, CERT, MEI)"
              value={codePrefix}
              onChange={(e) => setCodePrefix(e.target.value)}
            />
          </div>

          <button type="submit">Criar serviço</button>
        </form>

        <h2>Serviços cadastrados</h2>

        {loadingServices ? (
          <p>Carregando serviços...</p>
        ) : services.length === 0 ? (
          <p>Nenhum serviço cadastrado.</p>
        ) : (
          <div>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                {editingId === service.id ? (
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                      />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <input
                        type="text"
                        value={editCodePrefix}
                        onChange={(e) => setEditCodePrefix(e.target.value)}
                        placeholder="Prefixo (CPF, CNH, CERT, MEI)"
                      />
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateService(service.id)}
                      >
                        Salvar
                      </button>

                      <button type="button" onClick={cancelEditing}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <p>
                      <strong>Preço:</strong> R$ {service.price}
                    </p>
                    <p>
                      <strong>Prefixo:</strong> {service.codePrefix || "—"}
                    </p>

                    <div
                      style={{ display: "flex", gap: "8px", marginTop: "12px" }}
                    >
                      <button
                        type="button"
                        onClick={() => startEditing(service)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}