const ORDERS_STORAGE_KEY = "warungsync_demo_orders";

export const createOrder = async (payload: any) => {
  const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  const newOrder = {
    ...payload,
    id: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return { data: newOrder };
};

export const fetchOrders = async () => {
  return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
};

export const updateOrderStatus = async (id: string, payload: { status: string; courierId?: string }) => {
  let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  orders = orders.map((o: any) => o.id === id ? { ...o, status: payload.status, courierId: payload.courierId } : o);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return { success: true };
};