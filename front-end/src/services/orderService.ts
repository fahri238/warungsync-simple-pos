import { apiFetch } from "@/lib/store";
import type { Order } from "@/types";

export const fetchOrders = async (storeId?: string | number): Promise<Order[]> => {
  try {
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

export const createOrder = async (orderData: any) => {
  // ==========================================
  // DATA MAPPING: Frontend (EN) -> Backend (ID)
  // ==========================================
  
  let translatedTipePesanan = "online";
  if (orderData.type === "pos") translatedTipePesanan = "offline";
  
  let translatedMetodeBayar = "transfer";
  if (orderData.paymentMethod === "cash") translatedMetodeBayar = "tunai";
  
  let translatedTipePengiriman = "kurir";
  if (orderData.fulfillment === "pickup") translatedTipePengiriman = "pickup";

  const payload = {
    ...orderData,
    tipe_pesanan: translatedTipePesanan,
    metode_pembayaran: translatedMetodeBayar,
    tipe_pengiriman: translatedTipePengiriman,
  };

  return await apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateOrderStatus = async (
  orderId: string, 
  data: { status: string; courierId?: string }
) => {
  return await apiFetch(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};