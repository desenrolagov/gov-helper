"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LEGAL_VERSION, getLegalVersionLabel } from "@/lib/legal";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  active?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function isCpfService(name?: string | null) {
  return (name || "").toLowerCase().includes("cpf");
}

export default function ContinueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceId = searchParams.get("serviceId") || "";

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function loadService() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/services", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setError(data?.error || "Erro ao carregar serviço.");
          setService(null);
          return;
        }

        const services = Array.isArray(data)
          ? data.filter((item) => item?.active !== false)
          : [];

        const selected =
          services.find((item: Service) => item.id === serviceId) ||
          services.find((item: Service) => isCpfService(item.name)) ||
          services[0] ||
          null;

        setService(selected);

        if (!selected) {
          setError("Nenhum serviço disponível.");
        }
      } catch (err) {
        setError("Erro inesperado.");
        setService(null);
      } finally {
        setLoading(false);
      }
    }

    void loadService();
  }, [serviceId]);

  const callbackUrl = useMemo(() => {
    if (service?.id) return `/continue?serviceId=${service.id}`;
    if (serviceId) return `/continue?serviceId=${serviceId}`;
    return "/continue";
  }, [service?.id, serviceId]);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const canSubmit =
    !loading &&
    !submitting &&
    !!service?.id &&
    !!name.trim() &&
    !!email.trim() &&
    password.length >= 6 &&
    acceptedLegal;

  async function createOrder(selectedServiceId: string) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: selectedServiceId,
        termsAccepted: true,
        privacyAccepted: true,
        legalVersion: LEGAL_VERSION,
      }),
    });

    const data = await res.json().catch(() => null);
    return { res, data };
  }

  async function handleContinue() {
    try {
      setError("");

      if (!service?.id) return setError("Serviço não encontrado.");
      if (!name || !email || !password)
        return setError("Preencha os dados.");
      if (password.length < 6)
        return setError("Senha mínima de 6 caracteres.");
      if (!acceptedLegal)
        return setError("Aceite os termos para continuar.");

      setSubmitting(true);

      const direct = await createOrder(service.id);

      if (direct.res.ok) {
        router.replace(`/payment?orderId=${direct.data?.order?.id}`);
        return;
      }

      if (direct.res.status === 401) {
        await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email: email.toLowerCase(),
            password,
            lgpdAccepted: true,
            termsAccepted: true,
            privacyAccepted: true,
            legalAcceptedVersion: getLegalVersionLabel(),
          }),
        });

        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password,
          }),
        });

        const order = await createOrder(service.id);

        if (!order.res.ok) {
          setError("Erro ao continuar.");
          return;
        }

        router.replace(`/payment?orderId=${order.data?.order?.id}`);
        return;
      }

      setError("Erro ao continuar.");
    } catch {
      setError("Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-6xl">

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* ESQUERDA */}
          <section className="rounded-3xl bg-white p-6 shadow-sm">

            <h1 className="text-3xl font-black leading-tight">
              Finalize seu cadastro
            </h1>

            <ul className="mt-4 max-w-md space-y-2 text-sm leading-7 text-slate-600">
              <li>• Cadastro rápido</li>
              <li>• Pagamento na próxima etapa</li>
              <li>• Envio de documentos depois</li>
            </ul>

            <div className="mt-4 max-w-md rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              Assessoria privada, sem vínculo com órgãos públicos.
            </div>

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

          </section>

          {/* DIREITA */}
          <aside className="rounded-3xl border-2 border-slate-900 bg-white p-6">

            {loading ? (
              <div>Carregando...</div>
            ) : !service ? (
              <div>Sem serviço.</div>
            ) : (
              <>
                <h2 className="text-xl font-black">
                  {service.name}
                </h2>

                <ul className="mt-3 max-w-md space-y-2 text-sm leading-6 text-slate-600">
                  <li>• Atendimento completo</li>
                  <li>• Acompanhamento do processo</li>
                  <li>• Suporte durante todo o fluxo</li>
                </ul>

                <div className="mt-4 text-4xl font-black">
                  {formatCurrency(service.price)}
                </div>

                {/* FORM */}
                <div className="mt-5 space-y-4">

                  <input
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                  />

                  <input
                    placeholder="Seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                  />

                  <input
                    type="password"
                    placeholder="Crie uma senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3"
                  />

                </div>

                <label className="mt-4 flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={acceptedLegal}
                    onChange={(e) => setAcceptedLegal(e.target.checked)}
                  />
                  Aceito termos e política
                </label>

                <button
                  onClick={handleContinue}
                  disabled={!canSubmit}
                  className="mt-5 w-full rounded-2xl bg-slate-900 py-4 font-bold text-white"
                >
                  {submitting ? "Carregando..." : "Continuar para pagamento"}
                </button>

                <Link
                  href={loginHref}
                  className="mt-3 block text-center text-sm text-slate-500"
                >
                  Já tenho conta
                </Link>
              </>
            )}

          </aside>
        </div>
      </div>
    </main>
  );
}