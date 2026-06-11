const API_BASE_URL = "http://localhost:5000/api/deliveries";
const ORDERS_STORAGE_KEY = "warungsync_demo_orders"; 

export const assignCourier = async (orderId: string, courierId: string) => {
  try {
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
  } catch (error) {
    console.warn("Backend offline, menggunakan data lokal (Demo Mode) untuk assign kurir.");
    
    // Fallback: input courier ID manualLY inside localStorage
    let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    
    orders = orders.map((o: any) => {
      if (o.id === orderId) {
        return { 
          ...o, // copy all original data (include customerName, items, etc)
          status: "delivering", // change status to "Sedang Diantar"
          courierId: courierId, // fill ID courier that admine choose
          deliveryId: `DEL-${Date.now()}` // create fake ID delivery (for demo)
        };
      }
      return o;
    });
    
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return { success: true };
  }
};

export const completeDelivery = async (deliveryId: string) => {
  try {
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
  } catch (error) {
    console.warn("Backend offline, menggunakan data lokal (Demo Mode) untuk complete delivery.");
    
    let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    orders = orders.map((o: any) => 
      o.deliveryId === deliveryId 
        ? { ...o, status: "completed" } 
        : o
    );
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    return { success: true };
  }
};