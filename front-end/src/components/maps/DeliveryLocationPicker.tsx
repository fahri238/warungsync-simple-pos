import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

const DEFAULT_CENTER: [number, number] = [-2.1234567, 115.1234567];

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface DeliveryLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

const DeliveryLocationPicker = ({
  latitude,
  longitude,
  onChange,
  height = "240px",
}: DeliveryLocationPickerProps) => {
  const [center, setCenter] = useState<[number, number]>(
    latitude != null && longitude != null
      ? [latitude, longitude]
      : DEFAULT_CENTER,
  );

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Ketuk peta untuk menandai titik lokasi pengiriman Anda
      </p>
      <div className="overflow-hidden rounded-xl border" style={{ height }}>
        <MapContainer center={center} zoom={14} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onChange={onChange} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      {position && (
        <p className="text-xs text-muted-foreground">
          Koordinat: {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default DeliveryLocationPicker;
