"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
};

type DocumentItem = {
  id: string;
  kind: "CLIENT_UPLOAD" | "ADMIN_RESULT";
  originalName: string;
  url: string;
  createdAt: string;
  type?: string;
  order: {
    id: string;
    orderCode?: string | null;
    status: string;
    serviceName: string;
  };
};

type DocumentsResponse = {
  sentDocuments: DocumentItem[];
  deliveredDocuments: DocumentItem[];
};

type Props = {
  user: User;
};

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return "Pago";
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos";
    case "PROCESSING":
      return "Em andamento";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function SectionCard({
  title,
  description,
  emptyMessage,
  items,
  buttonLabel,
  badgeLabel,
  badgeTone = "slate",
}: {
  title: string;
  description: string;
  emptyMessage: string;
  items: DocumentItem[];
  buttonLabel: string;
  badgeLabel: string;
  badgeTone?: "slate" | "emerald";
}) {
  const badgeClasses =
    badgeTone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}
        >
          {badgeLabel}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((doc) => (
            <div
              key={`${doc.kind}-${doc.id}`}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {doc.originalName}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    Serviço: {doc.order.serviceName}
                  </p>

                  <p className="text-sm text-gray-600">
                    Pedido: {doc.order.orderCode || doc.order.id}
                  </p>

                  <p className="text-sm text-gray-600">
                    Status: {getStatusLabel(doc.order.status)}
                  </p>

                  {doc.type ? (
                    <p className="text-sm text-gray-600">
                      Tipo: {doc.type}
                    </p>
                  ) : null}

                  <p className="text-sm text-gray-600">
                    Enviado em: {formatDate(doc.createdAt)}
                  </p>
                </div>

                <div>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {buttonLabel}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DocumentsClient({ user }: Props) {
  const [sentDocuments, setSentDocuments] = useState<DocumentItem[]>([]);
  const [deliveredDocuments, setDeliveredDocuments] = useState<DocumentItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDocuments() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/my-documents", {
          cache: "no-store",
        });

        const data = (await res.json()) as DocumentsResponse | { error?: string };

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Erro ao carregar documentos."
          );
        }

        if (!("sentDocuments" in data) || !("deliveredDocuments" in data)) {
          throw new Error("Resposta inválida da API de documentos.");
        }

        setSentDocuments(data.sentDocuments || []);
        setDeliveredDocuments(data.deliveredDocuments || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar documentos."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <AppNav user={user} />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meus documentos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Aqui os arquivos ficam separados entre o que você enviou e o que foi
            liberado pela equipe no final do atendimento.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700">
            Cliente:{" "}
            <span className="font-semibold">{user.name || user.email}</span>
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Carregando documentos...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            <SectionCard
              title="Documentos enviados por você"
              description="Arquivos e comprovantes que você anexou durante o atendimento."
              emptyMessage="Você ainda não enviou documentos vinculados aos seus pedidos."
              items={sentDocuments}
              buttonLabel="Abrir envio"
              badgeLabel={`${sentDocuments.length} arquivo${
                sentDocuments.length === 1 ? "" : "s"
              }`}
              badgeTone="slate"
            />

            <SectionCard
              title="Documentos liberados pela equipe"
              description="Arquivos finais entregues ao concluir o serviço."
              emptyMessage="Nenhum documento final foi liberado para você até o momento."
              items={deliveredDocuments}
              buttonLabel="Abrir documento final"
              badgeLabel={`${deliveredDocuments.length} liberado${
                deliveredDocuments.length === 1 ? "" : "s"
              }`}
              badgeTone="emerald"
            />
          </div>
        )}
      </section>
    </main>
  );
}