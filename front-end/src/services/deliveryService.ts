const API_BASE_URL = "http://localhost:5000/api/deliveries";

export const assignCourier = async (orderId: string, courierId: string) => {
  const response = await fetch(`${API_BASE_URL}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      courierId,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Gagal menugaskan kurir");
  }
  return data;
};

export const completeDelivery = async (deliveryId: string) => {
  const response = await fetch(`${API_BASE_URL}/${deliveryId}/complete`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Gagal menyelesaikan pengiriman");
  }
  return data;
};
