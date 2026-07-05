import { apiFetch } from "@/lib/store";
import type { Order } from "@/types";

// PERUBAHAN: Menambahkan parameter storeId (opsional) untuk Multi-Warung
export const fetchOrders = async (storeId?: string | number): Promise<Order[]> => {
  try {
    // Jika storeId ada, tambahkan sebagai query parameter (hanya ambil pesanan toko tsb)
    const endpoint = storeId ? `/orders?storeId=${storeId}` : "/orders";
    const response = await apiFetch(endpoint);
    return response.data || [];
  } catch (error) {
    console.error("Gagal mengambil data pesanan:", error);
    return [];
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const response = await apiFetch(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil detail pesanan:", error);
    return null;
  }
};

// PERUBAHAN: Mengirim data ke API, bukan ke Local Storage lagi
export const createOrder = async (orderData: any) => {
  return await apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
};

// PERUBAHAN: Update status ke API Backend
export const updateOrderStatus = async (
  orderId: string, 
  data: { status: string; courierId?: string }
) => {
  return await apiFetch(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};