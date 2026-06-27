import {
  Product,
  Category,
  Order,
  StockLog,
  DeliverySettings,
  OrderItem,
  Delivery,
} from "@/types";
import { defaultProductImages } from "@/lib/product-images";

// ================= KONFIGURASI API =================
// Sesuaikan PORT dengan backend Anda (misal: 5000)
const API_BASE_URL = "http://localhost:5000/api";

const SESSION_KEY = "warungsync_session";
const CART_BY_STORE_KEY = "warungsync_cart_by_store";
const CART_KEY = "warungsync_cart"; // Legacy

// ================= HELPER LOCAL STORAGE =================
function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ================= HELPER API FETCH =================
// Fungsi sakti untuk mengambil data dari backend dengan otomatis menyisipkan Token JWT
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Jika sudah login, sisipkan token untuk rute yang dilindungi (Protected Routes)
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server");
  }
  return data; // Backend kita mereturn { success, data, message }
}

// ================= USER & AUTHENTICATION =================
export interface User {
  id: string | number;
  store_id?: string | number | null;
  name: string;
  email: string;
  phone?: string;
  kontak?: string;
  role: "admin" | "customer" | "courier";
  address?: string;
  token?: string; // Token JWT dari backend
}

export function getSession(): User | null {
  return get(SESSION_KEY, null);
}

export function setSession(user: User | null) {
  if (user) set(SESSION_KEY, user);
  else localStorage.removeItem(SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// FUNGSI LOGIN VIA API
export async function login(email: string, password: string): Promise<User | string> {
  try {
    const res = await apiFetch("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, kata_sandi: password }),
    });
    
    // Gabungkan data user dan token, lalu simpan ke Local Storage
    const sessionData = { ...res.data.user, token: res.data.token };
    setSession(sessionData);
    return sessionData;
  } catch (error: any) {
    return error.message; // Return string pesan error jika gagal
  }
}

// FUNGSI REGISTER VIA API
export async function register(
  name: string,
  email: string,
  password: string,
  phone: string,
  role: "customer" | "courier" | "admin" = "customer",
  address?: string,
  storeId?: string | null
): Promise<User | string> {
  try {
    const res = await apiFetch("/users/register", {
      method: "POST",
      body: JSON.stringify({
        nama: name,
        email,
        kata_sandi: password,
        kontak: phone,
        peran: role,
        alamat: address,
        store_id: storeId,
      }),
    });
    return res.data;
  } catch (error: any) {
    return error.message;
  }
}

// FUNGSI UPDATE PROFIL VIA API
export async function updateProfile(
  updates: { nama?: string; kontak?: string; alamat?: string }
): Promise<User | string> {
  try {
    const res = await apiFetch("/users/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    
    const current = getSession();
    if (current) setSession({ ...current, ...res.data });
    return res.data;
  } catch (error: any) {
    return error.message;
  }
}

// ================= CART (TETAP DI LOCAL STORAGE) =================
type CartByStore = Record<string, OrderItem[]>;

function migrateLegacyCart(): CartByStore {
  const legacy = get<OrderItem[]>(CART_KEY, []);
  const byStore = get<CartByStore>(CART_BY_STORE_KEY, {});
  if (legacy.length > 0 && Object.keys(byStore).length === 0) {
    // Migrasi darurat jika ada cart model lama
    byStore["store-mama-eva"] = legacy; 
    set(CART_BY_STORE_KEY, byStore);
    localStorage.removeItem(CART_KEY);
  }
  return byStore;
}

export function getCart(storeId: string): OrderItem[] {
  const byStore = migrateLegacyCart();
  return byStore[storeId] || [];
}

export function saveCart(storeId: string, items: OrderItem[]) {
  const byStore = migrateLegacyCart();
  if (items.length === 0) {
    delete byStore[storeId];
  } else {
    byStore[storeId] = items;
  }
  set(CART_BY_STORE_KEY, byStore);
}

export function clearOtherStoreCarts(activeStoreId: string) {
  const byStore = migrateLegacyCart();
  const active = byStore[activeStoreId];
  const next: CartByStore = active ? { [activeStoreId]: active } : {};
  set(CART_BY_STORE_KEY, next);
}

export function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function getSubtotal(item: OrderItem): number {
  return item.product.price * item.quantity;
}

// ================= PRODUCTS & CATEGORIES VIA API =================
export function getProductImage(product: Product): string {
  if (product.image && product.image.length > 5) return product.image;
  return defaultProductImages[product.id] || "/placeholder.svg";
}

export async function getProductsFromAPI(storeId?: string): Promise<Product[]> {
  if (!storeId) return [];
  try {
    const res = await apiFetch(`/products?storeId=${storeId}`);
    return res.data;
  } catch (error) {
    console.error("Gagal load produk:", error);
    return [];
  }
}

export async function getCategoriesFromAPI(storeId?: string): Promise<Category[]> {
  if (!storeId) return [];
  try {
    const res = await apiFetch(`/products/categories?storeId=${storeId}`);
    return res.data;
  } catch (error) {
    console.error("Gagal load kategori:", error);
    return [];
  }
}

// ================= STOCK & ORDERS =================

// ⚠️ CATATAN PENTING:
// Dulu fungsi updateStock ini secara manual memotong localStorage.
// Sekarang kita BIAKAN KOSONG, karena pemotongan stok dan riwayat sudah
// otomatis ditangani oleh Backend secara presisi menggunakan Database Transaction!
export function updateStock(items: OrderItem[]): boolean {
  console.log("Pengurangan stok diserahkan sepenuhnya ke Backend (Order Controller)");
  return true;
}

// ================= DELIVERY SETTINGS =================
export function getDeliverySettings(): DeliverySettings {
  return get("warungsync_delivery", { enabled: true });
}