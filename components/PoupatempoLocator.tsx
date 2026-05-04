
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const PoupatempoMap = dynamic(() => import("@/components/PoupatempoMap"), {
  ssr: false,
});

type NearbyUnit = {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceKm: number;
};

type Props = {
  orderId: string;
  selectedName?: string | null;
  selectedAddress?: string | null;
  selectedDistanceKm?: number | null;
  onSelected?: (unit: NearbyUnit) => void;
};

export default function PoupatempoLocator({
  orderId,
  selectedName,
  selectedAddress,
  selectedDistanceKm,
  onSelected,
}: Props) {
  const [address, setAddress] = useState("");
  const [units, setUnits] = useState<NearbyUnit[]>([]);
  const [customerLocation, setCustomerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<NearbyUnit | null>(null);

  async function searchNearby() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/poupatempo/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao buscar unidades.");
        return;
      }

      setCustomerLocation(data.customerLocation);
      setUnits(data.units || []);
    } finally {
      setLoading(false);
    }
  }

  async function chooseUnit(unit: NearbyUnit) {
    try {
      setSavingId(unit.id);
      onSelected?.(unit);
      setError("");

      const res = await fetch(`/api/orders/${orderId}/poupatempo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerAddress: address,
          name: unit.name,
          address: unit.address,
          city: unit.city,
          distanceKm: unit.distanceKm,
          lat: unit.lat,
          lng: unit.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao escolher unidade.");
        return;
      }

      setSelected(unit);
      onSelected?.(unit);
    } finally {
      setSavingId("");
    }
  }

  const currentSelectedName = selected?.name || selectedName;
  const currentSelectedAddress = selected?.address || selectedAddress;
  const currentSelectedDistance =
    selected?.distanceKm || selectedDistanceKm || null;

  return (
    <div className="mt-5 rounded-3xl bg-white p-5 text-slate-950 shadow-xl">
      <p className="text-xs font-black uppercase tracking-wide text-blue-700">
        Unidade Poupatempo
      </p>

      <h2 className="mt-2 text-2xl font-black">
        Escolha o Poupatempo mais próximo
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Digite seu CEP ou endereço. Vamos mostrar as unidades mais próximas para
        você escolher.
      </p>

      {currentSelectedName && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-black text-green-800">
            Unidade escolhida ✅
          </p>
          <p className="mt-1 text-sm font-bold text-slate-950">
            {currentSelectedName}
          </p>
          <p className="mt-1 text-xs text-slate-600">{currentSelectedAddress}</p>
          {currentSelectedDistance && (
            <p className="mt-1 text-xs font-bold text-slate-700">
              Aproximadamente {currentSelectedDistance} km de distância
            </p>
          )}
          <button
            type="button"
                onClick={() => {
                setSelected(null);
                setError("");
                setUnits([]);
                      }}
                    className="mt-3 rounded-xl border border-green-300 bg-white px-4 py-2 text-xs font-black text-green-700"
                     >
                 Alterar unidade
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Digite seu CEP ou endereço"
          className="min-h-12 flex-1 rounded-2xl border border-slate-300 px-4 text-sm font-semibold outline-none focus:border-blue-600"
        />

        <button
          onClick={searchNearby}
          disabled={loading}
          className="min-h-12 rounded-2xl bg-blue-700 px-5 text-sm font-black text-white disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

      {customerLocation && units.length > 0 && (
        <>
          <PoupatempoMap customerLocation={customerLocation} units={units} />

          <div className="mt-4 space-y-3">
                {(selected ? [selected] : units).map((unit, index) => (              <div
                key={unit.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-blue-700">
                      Opção {index + 1}
                    </p>

                    <h3 className="mt-1 text-base font-black text-slate-950">
                      {unit.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {unit.address}
                    </p>

                    <p className="mt-2 text-sm font-black text-slate-900">
                      {unit.distanceKm} km de distância
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => chooseUnit(unit)}
                  disabled={savingId === unit.id}
                  className="mt-4 w-full rounded-2xl bg-green-500 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {selected?.id === unit.id
                  ? "✅ Unidade selecionada"
                  : savingId === unit.id
                   ? "Salvando..."
                 : "Escolher esta unidade"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}