import { NextRequest, NextResponse } from "next/server";
import { calculateDistanceKm } from "@/lib/distance";
import { POUPATEMPO_UNITS } from "@/lib/poupatempo-units";

async function geocodeAddress(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      address
    )}`,
    {
      headers: {
        "User-Agent": "DesenrolaGov/1.0",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!Array.isArray(data) || !data[0]) {
    return null;
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const address = typeof body?.address === "string" ? body.address.trim() : "";

    if (!address || address.length < 5) {
      return NextResponse.json(
        { error: "Digite um CEP ou endereço válido." },
        { status: 400 }
      );
    }

    const customerLocation = await geocodeAddress(`${address}, São Paulo, Brasil`);

    if (!customerLocation) {
      return NextResponse.json(
        { error: "Não conseguimos localizar esse endereço." },
        { status: 404 }
      );
    }

    const unitsWithCoords = await Promise.all(
      POUPATEMPO_UNITS.map(async (unit) => {
        const fullAddress = `${unit.address}, ${unit.city}, São Paulo, Brasil`;
        const coords = await geocodeAddress(fullAddress);

        if (!coords) return null;

        return {
          ...unit,
          lat: coords.lat,
          lng: coords.lng,
          distanceKm: calculateDistanceKm(
            customerLocation.lat,
            customerLocation.lng,
            coords.lat,
            coords.lng
          ),
        };
      })
    );

    const units = unitsWithCoords
      .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);

    return NextResponse.json({
      customerLocation,
      units,
    });
  } catch (error) {
    console.error("Erro ao buscar Poupatempo próximo:", error);

    return NextResponse.json(
      { error: "Erro ao buscar unidades próximas." },
      { status: 500 }
    );
  }
}