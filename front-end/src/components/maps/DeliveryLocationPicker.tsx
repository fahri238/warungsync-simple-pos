import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// fixing builtin leaflet icon marker 
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

// click getter on the map (to put PIN)
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

// component force map shift to it.s (FlyTo) perspective (center)
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), {
      animate: true,
      duration: 1.5 
    });
  }, [center, map]);
  return null;
}

interface DeliveryLocationPickerProps {
  latitude: number | null; // Red pin dot (can be null at begining)
  longitude: number | null; 
  mapCenter: [number, number]; // camera map direction 
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

const DeliveryLocationPicker = ({
  latitude,
  longitude,
  mapCenter,
  onChange,
  height = "100%", 
}: DeliveryLocationPickerProps) => {
  
  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  return (
    <div className="w-full relative z-0 overflow-hidden" style={{ height }}>
      {/* Peta selalu mengarah ke mapCenter */}
      <MapContainer center={mapCenter} zoom={15} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* call update functions in order to react camera on GPS */}
        <MapUpdater center={mapCenter} />
        
        {/* capture klik event to set PIN */}
        <MapClickHandler onPick={onChange} />
        
        {/* diplay pin only if position not null */}
        {position && (
          <Marker
            position={position}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target;
                const latlng = marker.getLatLng();
                onChange(latlng.lat, latlng.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryLocationPicker;