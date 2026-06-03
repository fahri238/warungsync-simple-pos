import type { FulfillmentType, OrderItem, OrderType, PaymentMethod } from "@/types";

const API_BASE_URL = "http://localhost:5000/api/orders";

export const createOrder = async (payload: {
  userId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  type: OrderType;
  fulfillment: FulfillmentType;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  status?: "pending" | "processing" | "ready" | "delivering" | "completed";
}) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_pengguna: payload.userId || null,
      nama_pelanggan: payload.customerName,
      no_hp_pelanggan: payload.customerPhone,
      alamat_pengiriman: payload.deliveryAddress || null,
      tipe_pesanan: payload.type,
      tipe_pengiriman: payload.fulfillment,
      metode_pembayaran: payload.paymentMethod,
      status: payload.status,
      items: payload.items.map((item) => ({
        id_produk: item.product.id,
        kuantitas: item.quantity,
      })),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Gagal membuat pesanan");
  }

  return data;
};

export const fetchOrders = async (filters?: { userId?: string; type?: OrderType }) => {
  const params = new URLSearchParams();
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.type) params.set("type", filters.type);
  const url = params.toString() ? `${API_BASE_URL}?${params.toString()}` : API_BASE_URL;

  const response = await fetch(url, { method: "GET" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Gagal memuat pesanan");
  }
  return data.data || [];
};

export const updateOrderStatus = async (id: string, payload: { status: string; courierId?: string }) => {
  const response = await fetch(`${API_BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: payload.status,
      id_kurir: payload.courierId || null,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Gagal memperbarui status pesanan");
  }
  return data;
};
