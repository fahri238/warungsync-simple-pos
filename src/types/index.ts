export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = "pending" | "processing" | "ready" | "delivering" | "completed";
export type PaymentMethod = "cash" | "transfer";
export type OrderType = "pos" | "online";
export type FulfillmentType = "pickup" | "delivery";

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  type: OrderType;
  fulfillment: FulfillmentType;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  createdAt: string;
  courierId?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  change: number;
  reason: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  courierId: string;
  address: string;
  status: "delivering" | "delivered";
  updatedAt: string;
}

export interface DeliverySettings {
  enabled: boolean;
}
