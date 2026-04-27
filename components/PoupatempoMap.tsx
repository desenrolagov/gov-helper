"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type MapUnit = {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  distanceKm: number;
};

type Props = {
  customerLocation: {
    lat: number;
    lng: number;
  };
  units: MapUnit[];
};

export default function PoupatempoMap({ customerLocation, units }: Props) {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
      <MapContainer
        center={[customerLocation.lat, customerLocation.lng]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-[280px] w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[customerLocation.lat, customerLocation.lng]}>
          <Popup>Seu endereço informado</Popup>
        </Marker>

        {units.map((unit) => (
          <Marker key={unit.id} position={[unit.lat, unit.lng]}>
            <Popup>
              <strong>{unit.name}</strong>
              <br />
              {unit.address}
              <br />
              {unit.distanceKm} km
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}