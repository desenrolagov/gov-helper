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
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <section className="rounded-3xl bg-white p-6 text-[var(--text-dark)] shadow-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${badgeClasses}`}
        >
          {badgeLabel}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((doc) => (
            <div
              key={`${doc.kind}-${doc.id}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    {doc.originalName}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Serviço: {doc.order.serviceName}
                  </p>

                  <p className="text-sm text-slate-600">
                    Pedido: {doc.order.orderCode || doc.order.id}
                  </p>

                  <p className="text-sm text-slate-600">
                    Status: {getStatusLabel(doc.order.status)}
                  </p>

                  {doc.type ? (
                    <p className="text-sm text-slate-600">Tipo: {doc.type}</p>
                  ) : null}

                  <p className="text-sm text-slate-600">
                    Enviado em: {formatDate(doc.createdAt)}
                  </p>
                </div>

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--accent-green)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent-green-hover)]"
                >
                  {buttonLabel}
                </a>
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
    <main className="min-h-screen bg-[var(--primary-blue)] text-white">
      <AppNav user={user} />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-green-300">Área do cliente</p>
          <h1 className="mt-1 text-3xl font-black">Meus documentos</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Aqui os arquivos ficam separados entre o que você enviou e o que foi
            liberado pela equipe no final do atendimento.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-[var(--primary-blue-strong)] p-4 shadow-xl shadow-black/20">
          <p className="text-sm text-white/75">
            Cliente:{" "}
            <span className="font-bold text-white">
              {user.name || user.email}
            </span>
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[var(--primary-blue-strong)] p-6 shadow-xl shadow-black/20">
            <p className="text-sm text-white/70">Carregando documentos...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-6">
            <p className="text-sm text-red-100">{error}</p>
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