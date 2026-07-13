const API_BASE_URL = "http://localhost:5000/api/stores";

export interface Store {
  id: string;
  name: string;
  address?: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ShippingRate {
  id: string;
  storeId: string;
  villageName: string;
  rate: number;
}

const DEFAULT_STORES: Store[] = [
  {
    id: "store-mama-eva",
    name: "Warung Mama Eva",
    address: "Kecamatan Montallat, Kalimantan Selatan",
    latitude: -2.1234567,
    longitude: 115.1234567,
  },
];

const apiCall = async (endpoint: string) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }
  return data;
};

export const fetchStores = async (): Promise<Store[]> => {
  try {
    const response = await apiCall("");
    return response.data?.length ? response.data : DEFAULT_STORES;
  } catch {
    return DEFAULT_STORES;
  }
};

export const fetchStoreById = async (id: string): Promise<Store> => {
  try {
    const response = await apiCall(`/${id}`);
    return response.data;
  } catch {
    const fallback = DEFAULT_STORES.find((s) => s.id === id);
    if (fallback) return fallback;
    return DEFAULT_STORES[0]; 
  }
};

export const fetchShippingRates = async (storeId: string): Promise<ShippingRate[]> => {
  try {
    const response = await apiCall(`/${storeId}/shipping-rates`);
    // PERBAIKAN: Hanya kembalikan data asli dari API. Jika kosong, kembalikan array kosong.
    return response.data || [];
  } catch {
    // Hilangkan data fallback (dummy). Jika error, anggap tidak ada wilayah.
    return [];
  }
};