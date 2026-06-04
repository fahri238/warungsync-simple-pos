import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Store } from "@/services/storeService";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icons in Vite bundler
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const MONTALLAT_CENTER: [number, number] = [-2.1234567, 115.1234567];

function FitBounds({ stores }: { stores: Store[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = stores
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => [s.latitude!, s.longitude!] as [number, number]);

    if (coords.length === 0) {
      map.setView(MONTALLAT_CENTER, 12);
      return;
    }
    if (coords.length === 1) {
      map.setView(coords[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
  }, [stores, map]);

  return null;
}

interface StoreMapProps {
  stores: Store[];
  onSelectStore?: (store: Store) => void;
  height?: string;
}

const StoreMap = ({ stores, onSelectStore, height = "320px" }: StoreMapProps) => {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ height }}>
      <MapContainer
        center={MONTALLAT_CENTER}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds stores={stores} />
        {stores.map((store) => {
          if (store.latitude == null || store.longitude == null) return null;
          return (
            <Marker
              key={store.id}
              position={[store.latitude, store.longitude]}
              eventHandlers={{
                click: () => onSelectStore?.(store),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{store.name}</p>
                  {store.address && (
                    <p className="text-muted-foreground">{store.address}</p>
                  )}
                  {onSelectStore && (
                    <button
                      type="button"
                      className="mt-2 text-primary underline"
                      onClick={() => onSelectStore(store)}
                    >
                      Pilih toko ini
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default StoreMap;
