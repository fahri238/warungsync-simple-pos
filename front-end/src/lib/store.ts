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
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const session = getSession();

  // PERBAIKAN: Jangan hardcode Content-Type
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Cek apakah data yang dikirim adalah FormData (File Upload)
  const isFormData = options.body instanceof FormData;

  // Jika BUKAN FormData, paksa gunakan JSON.
  // Jika FormData, JANGAN set Content-Type, biarkan Browser yang mengaturnya.
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Mencegah error "Unexpected token <" jika server nyasar ke halaman HTML
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(
      "Server gagal merespons dengan benar (Endpoint tidak ditemukan atau Error Server).",
    );
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server");
  }
  return data;
}

// ================= USER & AUTHENTICATION =================
export interface User {
  id: string | number;
  store_id?: string | number | null;
  name: string;
  email: string;
  phone?: string;
  kontak?: string;
  role: "admin" | "owner" | "customer" | "courier";
  address?: string;
  token?: string;
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

export async function login(
  email: string,
  password: string,
): Promise<User | string> {
  try {
    const res = await apiFetch("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, kata_sandi: password }),
    });

    const sessionData = { ...res.data.user, token: res.data.token };
    setSession(sessionData);
    return sessionData;
  } catch (error: any) {
    return error.message;
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  phone: string,
  role: "customer" | "courier" | "admin" | "owner" = "customer",
  address?: string,
  storeId?: string | null,
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

export async function updateProfile(updates: {
  nama?: string;
  kontak?: string;
  alamat?: string;
}): Promise<User | string> {
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
  return items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
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

export async function getCategoriesFromAPI(
  storeId?: string,
): Promise<Category[]> {
  if (!storeId) return [];
  try {
    const res = await apiFetch(`/products/categories?storeId=${storeId}`);
    return res.data;
  } catch (error) {
    console.error("Gagal load kategori:", error);
    return [];
  }
}

export function updateStock(items: OrderItem[]): boolean {
  console.log(
    "Pengurangan stok diserahkan sepenuhnya ke Backend (Order Controller)",
  );
  return true;
}

// ==========================================================
// FUNGSI API UNTUK CRUD PRODUK & KATEGORI (REAL DATABASE)
// ==========================================================

export const addProductToAPI = async (productData: any) => {
  const session = getSession();

  const categoryIdStr = String(productData.category);

  const payload = {
    ...productData,
    id_kategori: categoryIdStr,
    kategori: categoryIdStr,
    category: categoryIdStr,
    nama: productData.name,
    harga: Number(productData.price),
    harga_modal: Number(productData.capitalPrice || 0),
    capitalPrice: Number(productData.capitalPrice || 0),
    stok: Number(productData.stock || 0),
    url_gambar: productData.image,
    deskripsi: productData.description,
    storeId: session?.store_id,
    store_id: session?.store_id,
  };

  return await apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateProductInAPI = async (
  id: string | number,
  productData: any,
) => {
  const session = getSession();

  const categoryIdStr = String(productData.category);

  const payload = {
    ...productData,
    id_kategori: categoryIdStr,
    kategori: categoryIdStr,
    category: categoryIdStr,
    nama: productData.name,
    harga: Number(productData.price),
    harga_modal: Number(productData.capitalPrice || 0),
    capitalPrice: Number(productData.capitalPrice || 0),
    stok: Number(productData.stock || 0),
    url_gambar: productData.image,
    deskripsi: productData.description,
    storeId: session?.store_id,
    store_id: session?.store_id,
  };

  return await apiFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deleteProductFromAPI = async (id: string | number) => {
  return await apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
};

export const addCategoryToAPI = async (categoryData: { name: string }) => {
  const session = getSession();
  return await apiFetch("/products/categories", {
    method: "POST",
    body: JSON.stringify({
      ...categoryData,
      storeId: session?.store_id,
      store_id: session?.store_id,
    }),
  });
};

export const deleteCategoryFromAPI = async (id: string | number) => {
  return await apiFetch(`/products/categories/${id}`, {
    method: "DELETE",
  });
};

// ==========================================================
// FUNGSI SEMENTARA UNTUK LAPORAN STOK & PENGATURAN WARUNG
// ==========================================================

export const getStockLogs = (): StockLog[] => {
  return [];
};

export const getDeliverySettings = () => {
  const saved = localStorage.getItem("warungsync_delivery_settings");
  return saved ? JSON.parse(saved) : { enabled: true };
};

export const saveDeliverySettings = (settings: { enabled: boolean }) => {
  localStorage.setItem(
    "warungsync_delivery_settings",
    JSON.stringify(settings),
  );
};
