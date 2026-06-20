import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { WarungSyncLogo } from "@/components/brand/WarungSyncLogo";
import { Button } from "@/components/ui/button";
import DeliveryLocationPicker from "@/components/maps/DeliveryLocationPicker";
import { 
  ArrowLeft, 
  MapPinned, 
  Crosshair, 
  MapPin, 
  Navigation,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const DEFAULT_CENTER: [number, number] = [-3.316694, 114.590111]; // Default: Banjarmasin

const LocationPickerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRole = new URLSearchParams(location.search).get("role");
  const state = location.state as {
    latitude?: number;
    longitude?: number;
  } | null;

  // 1. State red pin (coordinate that will get to save)
  const [latitude, setLatitude] = useState<number | null>(state?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(state?.longitude ?? null);
  
  // 2. State for map camera (direction view right now)
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    state?.latitude != null && state?.longitude != null 
      ? [state.latitude, state.longitude] 
      : DEFAULT_CENTER
  );
  
  const [isLocating, setIsLocating] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(
    state?.latitude != null && state?.longitude != null
  );

  useEffect(() => {
    if (searchRole !== "customer" && searchRole !== "store-owner") {
      navigate("/register", { replace: true });
    }
  }, [navigate, searchRole]);

  const roleLabel = searchRole === "customer" ? "Rumah" : "Toko";

  // A. stealth GPS Search Diam-diam (only shift camera, not pin)
  const fetchInitialLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // ONLY set mapCenter, let latitude & longitude still null
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Initial GPS Error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  // B. Manual Search GPS via Tombol (SHIFT KAMERA & STICK PIN)
  const handleManualLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLatitude(lat);
          setLongitude(lng);
          setMapCenter([lat, lng]); // Peta also fly to there
          setHasInteracted(true);
          setIsLocating(false);
          toast.success("Titik berhasil ditempatkan di lokasi Anda saat ini!");
        },
        (error) => {
          console.error("Manual GPS Error:", error);
          setIsLocating(false);
          toast.error("Gagal mengakses GPS browser Anda.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      toast.info("Browser tidak mendukung fitur GPS.");
    }
  };

  useEffect(() => {
    if (state?.latitude == null || state?.longitude == null) {
      fetchInitialLocation();
    }
  }, []);

  const handleSave = () => {
    if (latitude == null || longitude == null || !hasInteracted) {
      toast.error("Silakan ketuk peta atau klik 'Gunakan Lokasi Anda Saat Ini' terlebih dahulu");
      return;
    }

    navigate("/register", {
      replace: true,
      state: { latitude, longitude },
    });
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background overflow-hidden">
      
      {/* LEFT: MAP AREA */}
      <div className="relative flex-1 h-[60vh] lg:h-screen order-2 lg:order-1 bg-muted/20 border-t lg:border-t-0 lg:border-r border-border shadow-inner z-0">
        
        <div className="w-full h-full relative z-0 cursor-crosshair">
          <DeliveryLocationPicker
            latitude={latitude}
            longitude={longitude}
            mapCenter={mapCenter}
            onChange={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
              setHasInteracted(true);
            }}
            height="100%" 
          />
        </div>

        {/* Floating Badge */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
          <div className="bg-card/95 backdrop-blur shadow-lg border border-border/50 px-4 py-2.5 rounded-full flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            <span className="text-sm font-semibold text-foreground">Mode Peta Aktif</span>
          </div>
        </div>

        {/* Overlay information at the bottom */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] hidden lg:flex pointer-events-none transition-all duration-500">
          <div className="bg-primary/95 text-primary-foreground backdrop-blur shadow-2xl px-6 py-3 rounded-full flex items-center gap-3">
            <Navigation className="h-5 w-5 animate-bounce" />
            <span className="text-sm font-medium">
              {hasInteracted ? "Bisa seret pin merah jika kurang pas" : "Ketuk area peta untuk menancapkan pin lokasi"}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: PANEL CONTROL */}
      <div className="flex flex-col w-full lg:w-[450px] xl:w-[500px] h-auto lg:h-screen bg-card order-1 lg:order-2 z-10 shadow-2xl shrink-0">
        
        <div className="p-6 border-b border-border/50 flex items-center justify-between sticky top-0 z-20 bg-card/95 backdrop-blur">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground h-9 bg-background"
            asChild
          >
            <Link to="/register">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
          <WarungSyncLogo size="sm" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/50">
          
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20">
              <MapPinned className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Pilih Lokasi {roleLabel}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Kamera peta sudah otomatis mengarah ke wilayah Anda. Silakan <strong>ketuk pada peta</strong> untuk menempatkan pin lokasi di bangunan yang tepat.
            </p>
          </div>

          <div className={`border-2 shadow-sm rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${hasInteracted ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/60'}`}>
            <div className="absolute -right-4 -top-4 text-primary/5">
              <MapPin className="h-32 w-32" />
            </div>
            
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 block relative z-10">
              Koordinat Terpilih
            </Label>
            
            {hasInteracted && latitude != null && longitude != null ? (
              <div className="mt-2 relative z-10 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Latitude</span>
                  <span className="text-lg font-mono font-bold text-foreground tracking-tight">{latitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Longitude</span>
                  <span className="text-lg font-mono font-bold text-foreground tracking-tight">{longitude.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-warning relative z-10 bg-warning/10 p-3 rounded-lg border border-warning/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-semibold">Silakan ketuk peta terlebih dahulu</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              Lacak & Tetapkan Otomatis
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Klik tombol ini untuk langsung menempatkan pin persis di lokasi perangkat Anda berada saat ini.</p>
            
            <Button 
              variant="outline" 
              onClick={handleManualLocation}
              disabled={isLocating}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 h-11"
            >
              {isLocating ? (
                <>
                  <Crosshair className="h-4 w-4 animate-spin" />
                  Mencari Satelit GPS...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Gunakan Lokasi Anda Saat Ini
                </>
              )}
            </Button>
          </div>

        </div>

        <div className="p-6 bg-card border-t border-border/80 grid grid-cols-2 gap-3 shrink-0 z-20">
          <Button
            type="button"
            variant="outline"
            className="h-12 border-border/80 bg-background"
            onClick={() => navigate("/register")}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="h-12 shadow-lg shadow-primary/20"
            onClick={handleSave}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Simpan Titik
          </Button>
        </div>

      </div>
    </div>
  );
};

export default LocationPickerPage;