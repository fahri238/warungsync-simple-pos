import { apiFetch } from "@/lib/store";

// Kita tidak butuh API_BASE_URL mentah lagi karena apiFetch sudah mengaturnya
export const assignCourier = async (orderId: string, courierId: string) => {
  try {
    // apiFetch otomatis menyisipkan Token JWT ke dalam Headers
    const response = await apiFetch("/deliveries/assign", {
      method: "POST",
      body: JSON.stringify({
        orderId,
        courierId,
      }),
    });
    
    return response;
  } catch (error: any) {
    console.error("Gagal menugaskan kurir ke backend:", error.message);
    throw new Error(error.message || "Gagal menugaskan kurir");
  }
};

export const completeDelivery = async (deliveryId: string) => {
  try {
    const response = await apiFetch(`/deliveries/${deliveryId}/complete`, {
      method: "PUT",
    });

    return response;
  } catch (error: any) {
    console.error("Gagal menyelesaikan pengiriman di backend:", error.message);
    throw new Error(error.message || "Gagal menyelesaikan pengiriman");
  }
};