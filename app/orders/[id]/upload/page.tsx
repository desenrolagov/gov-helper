"use client";

import PoupatempoLocator from "@/components/PoupatempoLocator";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OrderCodeBadge from "@/components/OrderCodeBadge";
import {
  getRequiredDocumentsForService,
  resolveServiceTypeFromService,
  type DocumentKey,
} from "@/lib/service-documents";

type AllowedUploadStatus = "PAID" | "AWAITING_DOCUMENTS" | "PROCESSING";

type UploadedFileItem = {
  id: string;
  type?: string | null;
  originalName?: string | null;
  url?: string | null;
  createdAt?: string;
};

type OrderData = {
  id: string;
  orderCode?: string | null;
  status?: string;
  service?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
  } | null;
  uploadedFiles?: UploadedFileItem[];
  selectedPoupatempoName?: string | null;
  selectedPoupatempoAddress?: string | null;
  selectedPoupatempoDistanceKm?: number | null;
};

function canUploadForStatus(status?: string): status is AllowedUploadStatus {
  return status === "PAID" || status === "AWAITING_DOCUMENTS" || status === "PROCESSING";
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Aguardando pagamento";
    case "PAID":
      return "Pagamento aprovado";
    case "AWAITING_DOCUMENTS":
      return "Aguardando documentos";
    case "WAITING_OPERATOR_SCHEDULE_REVIEW":
      return "Aguardando unidade e horário";
    case "PROCESSING":
      return "Em andamento";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "Carregando pedido";
  }
}

function WaitingBlock() {
  return (
    <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-slate-900">
      <p className="text-xs font-black uppercase tracking-wide text-amber-800">
        Etapa concluída ✅
      </p>

      <h2 className="mt-2 text-xl font-black">Documentos enviados com sucesso</h2>

      <p className="mt-2 text-sm text-slate-700">
        Agora nossa equipe irá localizar o Poupatempo mais próximo e verificar
        os horários disponíveis para atendimento presencial com foto e biometria.
      </p>

      <div className="mt-4 rounded-2xl bg-white p-4">
        <p className="text-sm font-black">📍 Próxima etapa:</p>
        <p className="mt-1 text-sm text-slate-700">
          O operador irá informar a unidade e o melhor horário disponível.
        </p>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Você receberá o retorno pela plataforma ou WhatsApp.
      </p>
    </div>
  );
}

function MeiSuccessBlock() {
  return (
    <div className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-slate-900">
      <p className="text-xs font-black uppercase tracking-wide text-green-700">
        Dados enviados ✅
      </p>

      <h2 className="mt-2 text-xl font-black">Solicitação de MEI recebida</h2>

      <p className="mt-2 text-sm text-slate-700">
        Nossa equipe irá conferir as informações e iniciar a assessoria para abertura do seu MEI.
      </p>

      <p className="mt-3 text-xs text-slate-500">
        A DesenrolaGov é uma assessoria privada e não possui vínculo com órgãos do governo.
      </p>
    </div>
  );
}

export default function OrderUploadPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [progress, setProgress] = useState(0);
  const [meiSent, setMeiSent] = useState(false);

  const [meiForm, setMeiForm] = useState({
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    addressZipCode: "",
    addressStreet: "",
    addressNumber: "",
    addressDistrict: "",
    addressCity: "",
    addressState: "",
    addressComplement: "",
    businessActivity: "",
    fantasyName: "",
    hasGovBrAccount: "",
    notes: "",
  });

  const serviceType = useMemo(
    () => resolveServiceTypeFromService(order?.service),
    [order?.service]
  );

  const isMEI = serviceType === "MEI";
  const isRG = serviceType === "RG";

  const requiredDocuments = useMemo(() => {
    if (isMEI) return [];
    return getRequiredDocumentsForService(serviceType).slice(0, 2);
  }, [serviceType, isMEI]);

  const uploadedTypes = useMemo(() => {
    return new Set(
      (order?.uploadedFiles || [])
        .map((file) => file.type)
        .filter(Boolean) as string[]
    );
  }, [order?.uploadedFiles]);

  const uploadedRequiredCount = requiredDocuments.filter((doc) =>
    uploadedTypes.has(doc.key)
  ).length;

  const currentDocument = requiredDocuments.find(
    (doc) => !uploadedTypes.has(doc.key)
  );

  const currentStep = Math.min(uploadedRequiredCount + 1, 2);
  const uploadAllowed = canUploadForStatus(order?.status);
  const isWaiting = order?.status === "WAITING_OPERATOR_SCHEDULE_REVIEW";
  const allRequiredSent =
    !isMEI && requiredDocuments.length === 2 && uploadedRequiredCount >= 2;

async function loadOrder() {
  try {
    setOrderLoading(true);

    const res = await fetch(`/api/orders/${orderId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      setError("Não foi possível carregar o pedido.");
      return;
    }

    const data: OrderData = await res.json();
    setOrder(data);

    const currentServiceType = resolveServiceTypeFromService(data.service);

    if (currentServiceType === "MEI") {
      setProgress(meiSent ? 100 : 0);
      return;
    }

    const docs = getRequiredDocumentsForService(currentServiceType).slice(0, 2);

    const uploaded = new Set(
      (data.uploadedFiles || [])
        .map((file) => file.type)
        .filter(Boolean) as string[]
    );

    const sentCount = docs.filter((doc) => uploaded.has(doc.key)).length;

    const progressCalc = docs.length
      ? Math.round((sentCount / docs.length) * 100)
      : 0;

    setProgress(progressCalc);
  } finally {
    setOrderLoading(false);
  }
}

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function updateMeiForm(field: keyof typeof meiForm, value: string) {
    setMeiForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpload() {
    if (!currentDocument) {
      setError("Todos os documentos obrigatórios já foram enviados.");
      return;
    }

    if (!file) {
      setError(`Selecione o arquivo: ${currentDocument.label}.`);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("orderId", orderId);
      formData.append("type", currentDocument.key as DocumentKey);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar documento.");
        return;
      }

      setFile(null);

      await loadOrder();
      router.refresh();

      if (currentStep >= 2) {
        setSuccess("Documentos enviados. Agora vamos verificar a próxima etapa.");
      } else {
        setSuccess("Documento enviado. Agora envie o próximo documento.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitMei() {
    if (!meiForm.fullName.trim()) {
      setError("Informe seu nome completo.");
      return;
    }

    if (!meiForm.cpf.trim()) {
      setError("Informe seu CPF.");
      return;
    }

    if (!meiForm.phone.trim()) {
      setError("Informe seu telefone.");
      return;
    }

    if (!meiForm.email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }

    if (!meiForm.businessActivity.trim()) {
      setError("Informe a atividade que deseja exercer como MEI.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/orders/${orderId}/mei`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...meiForm,
          hasGovBrAccount:
            meiForm.hasGovBrAccount === "SIM"
              ? true
              : meiForm.hasGovBrAccount === "NAO"
                ? false
                : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar dados do MEI.");
        return;
      }

      setMeiSent(true);
      setProgress(100);
      setSuccess("Dados enviados com sucesso. Nossa equipe irá iniciar sua assessoria MEI.");

      await loadOrder();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--primary-blue)] px-4 pb-24 pt-6 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href={`/orders/${orderId}`} className="text-sm text-white/70 underline">
          ← Voltar
        </Link>

        <div className="mt-4">
          <OrderCodeBadge code={order?.orderCode} fallback={orderId.slice(0, 8)} />
        </div>

        <div className="mt-4">
          <span className="text-sm font-bold">{getStatusLabel(order?.status)}</span>
        </div>

        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-green-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isMEI && (
          <p className="mt-2 text-xs font-semibold text-white/80">
            {Math.min(uploadedRequiredCount, 2)}/2 documentos enviados
          </p>
        )}

        {isMEI && (
          <p className="mt-2 text-xs font-semibold text-white/80">
            {meiSent ? "Dados do MEI enviados" : "Preencha o formulário para iniciar"}
          </p>
        )}

        {isMEI && meiSent && <MeiSuccessBlock />}

        {isMEI && uploadAllowed && !meiSent && (
          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Assessoria MEI
            </p>

            <h1 className="mt-2 text-2xl font-black">
              Dados para abertura do MEI
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Preencha as informações abaixo para nossa equipe orientar e executar
              a abertura do seu MEI com segurança.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                value={meiForm.fullName}
                onChange={(e) => updateMeiForm("fullName", e.target.value)}
                placeholder="Nome completo"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.cpf}
                onChange={(e) => updateMeiForm("cpf", e.target.value)}
                placeholder="CPF"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.birthDate}
                onChange={(e) => updateMeiForm("birthDate", e.target.value)}
                type="date"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.phone}
                onChange={(e) => updateMeiForm("phone", e.target.value)}
                placeholder="Telefone / WhatsApp"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.email}
                onChange={(e) => updateMeiForm("email", e.target.value)}
                placeholder="E-mail"
                type="email"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={meiForm.addressZipCode}
                  onChange={(e) => updateMeiForm("addressZipCode", e.target.value)}
                  placeholder="CEP"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <input
                  value={meiForm.addressState}
                  onChange={(e) => updateMeiForm("addressState", e.target.value)}
                  placeholder="Estado"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <input
                value={meiForm.addressStreet}
                onChange={(e) => updateMeiForm("addressStreet", e.target.value)}
                placeholder="Rua / Avenida"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={meiForm.addressNumber}
                  onChange={(e) => updateMeiForm("addressNumber", e.target.value)}
                  placeholder="Número"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <input
                  value={meiForm.addressDistrict}
                  onChange={(e) => updateMeiForm("addressDistrict", e.target.value)}
                  placeholder="Bairro"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <input
                value={meiForm.addressCity}
                onChange={(e) => updateMeiForm("addressCity", e.target.value)}
                placeholder="Cidade"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.addressComplement}
                onChange={(e) => updateMeiForm("addressComplement", e.target.value)}
                placeholder="Complemento (opcional)"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.businessActivity}
                onChange={(e) => updateMeiForm("businessActivity", e.target.value)}
                placeholder="Atividade que deseja exercer (ex: manicure, vendedor, eletricista)"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <input
                value={meiForm.fantasyName}
                onChange={(e) => updateMeiForm("fantasyName", e.target.value)}
                placeholder="Nome fantasia (opcional)"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={meiForm.hasGovBrAccount}
                onChange={(e) => updateMeiForm("hasGovBrAccount", e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Possui conta gov.br?</option>
                <option value="SIM">Sim</option>
                <option value="NAO">Não</option>
              </select>

              <textarea
                value={meiForm.notes}
                onChange={(e) => updateMeiForm("notes", e.target.value)}
                placeholder="Observações ou dúvidas"
                rows={4}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-xs text-slate-600">
              A DesenrolaGov é uma assessoria privada e não possui vínculo com
              órgãos do governo. A abertura do MEI pode ser feita gratuitamente
              no site oficial.
            </div>

            {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
            {success && <p className="mt-3 text-sm font-bold text-green-600">{success}</p>}

            <button
              onClick={handleSubmitMei}
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-green-500 p-3 font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Enviando..." : "Enviar dados do MEI"}
            </button>
          </div>
        )}

        {!isMEI && (isWaiting || allRequiredSent) && (
          <>
            <WaitingBlock />

            {isRG && (
              <PoupatempoLocator
                orderId={orderId}
                selectedName={order?.selectedPoupatempoName}
                selectedAddress={order?.selectedPoupatempoAddress}
                selectedDistanceKm={order?.selectedPoupatempoDistanceKm}
              />
            )}
          </>
        )}

        {!isMEI && !isWaiting && !allRequiredSent && uploadAllowed && currentDocument && (
          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Etapa {currentStep}/2
            </p>

            <h1 className="mt-2 text-2xl font-black">
              Envie: {currentDocument.label}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Envie o documento solicitado para nossa equipe seguir com seu atendimento.
            </p>

            <label className="mt-5 block rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <span className="block text-sm font-black text-slate-900">
                {file ? file.name : "Clique para selecionar o arquivo"}
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Aceitamos imagem ou PDF.
              </span>
            </label>

            {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
            {success && <p className="mt-3 text-sm font-bold text-green-600">{success}</p>}

            <button
              onClick={handleUpload}
              disabled={loading || !file}
              className="mt-5 w-full rounded-xl bg-green-500 p-3 font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Enviando..." : `Enviar documento ${currentStep}/2`}
            </button>
          </div>
        )}

        {!uploadAllowed && !isWaiting && (
          <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950">
            <h2 className="text-xl font-black">
              {isMEI ? "Formulário indisponível" : "Upload indisponível"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {isMEI
                ? "O formulário será liberado após a confirmação do pagamento."
                : "O envio de documentos será liberado após a confirmação do pagamento."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}