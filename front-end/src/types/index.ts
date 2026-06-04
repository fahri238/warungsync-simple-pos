export interface Store {
  id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Product {
  id: string;
  storeId?: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  image: string;
  description: string;
}

export interface Category {
  id: string;
  storeId?: string;
  name: string;
}

export interface ShippingRate {
  id: string;
  storeId: string;
  villageName: string;
  rate: number;
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
  storeId?: string;
  items: OrderItem[];
  total: number;
  shippingFee?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  type: OrderType;
  fulfillment: FulfillmentType;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryId?: string;
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
