import { Product, Category, Order, StockLog, DeliverySettings, CartItem } from "@/types";

const PRODUCTS_KEY = "warungsync_products";
const CATEGORIES_KEY = "warungsync_categories";
const ORDERS_KEY = "warungsync_orders";
const STOCK_LOGS_KEY = "warungsync_stock_logs";
const DELIVERY_KEY = "warungsync_delivery";
const CART_KEY = "warungsync_cart";

const defaultCategories: Category[] = [
  { id: "cat-1", name: "Makanan" },
  { id: "cat-2", name: "Minuman" },
  { id: "cat-3", name: "Snack" },
  { id: "cat-4", name: "Lainnya" },
];

const defaultProducts: Product[] = [
  { id: "p-1", name: "Nasi Goreng", price: 15000, stock: 50, category: "cat-1", image: "🍛", description: "Nasi goreng spesial dengan telur dan ayam" },
  { id: "p-2", name: "Mie Goreng", price: 13000, stock: 40, category: "cat-1", image: "🍜", description: "Mie goreng dengan sayuran segar" },
  { id: "p-3", name: "Ayam Goreng", price: 18000, stock: 30, category: "cat-1", image: "🍗", description: "Ayam goreng crispy renyah" },
  { id: "p-4", name: "Soto Ayam", price: 12000, stock: 25, category: "cat-1", image: "🍲", description: "Soto ayam kuah bening" },
  { id: "p-5", name: "Es Teh Manis", price: 5000, stock: 100, category: "cat-2", image: "🧊", description: "Es teh manis segar" },
  { id: "p-6", name: "Es Jeruk", price: 7000, stock: 80, category: "cat-2", image: "🍊", description: "Es jeruk peras segar" },
  { id: "p-7", name: "Kopi", price: 8000, stock: 60, category: "cat-2", image: "☕", description: "Kopi tubruk khas" },
  { id: "p-8", name: "Kerupuk", price: 3000, stock: 200, category: "cat-3", image: "🥟", description: "Kerupuk renyah" },
  { id: "p-9", name: "Gorengan", price: 5000, stock: 70, category: "cat-3", image: "🧆", description: "Aneka gorengan hangat" },
  { id: "p-10", name: "Nasi Putih", price: 5000, stock: 100, category: "cat-4", image: "🍚", description: "Nasi putih hangat" },
];

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

// Products
export function getProducts(): Product[] { return get(PRODUCTS_KEY, defaultProducts); }
export function saveProducts(p: Product[]) { set(PRODUCTS_KEY, p); }
export function addProduct(p: Product) { const all = getProducts(); all.push(p); saveProducts(all); }
export function updateProduct(p: Product) { saveProducts(getProducts().map(x => x.id === p.id ? p : x)); }
export function deleteProduct(id: string) { saveProducts(getProducts().filter(x => x.id !== id)); }

// Categories
export function getCategories(): Category[] { return get(CATEGORIES_KEY, defaultCategories); }
export function saveCategories(c: Category[]) { set(CATEGORIES_KEY, c); }
export function addCategory(c: Category) { const all = getCategories(); all.push(c); saveCategories(all); }
export function updateCategory(c: Category) { saveCategories(getCategories().map(x => x.id === c.id ? c : x)); }
export function deleteCategory(id: string) { saveCategories(getCategories().filter(x => x.id !== id)); }

// Orders
export function getOrders(): Order[] { return get(ORDERS_KEY, []); }
export function saveOrders(o: Order[]) { set(ORDERS_KEY, o); }
export function addOrder(o: Order) { const all = getOrders(); all.unshift(o); saveOrders(all); }
export function updateOrder(o: Order) { saveOrders(getOrders().map(x => x.id === o.id ? o : x)); }

// Stock Logs
export function getStockLogs(): StockLog[] { return get(STOCK_LOGS_KEY, []); }
export function addStockLog(log: StockLog) { const all = getStockLogs(); all.unshift(log); set(STOCK_LOGS_KEY, all); }

// Delivery
export function getDeliverySettings(): DeliverySettings { return get(DELIVERY_KEY, { enabled: true }); }
export function saveDeliverySettings(s: DeliverySettings) { set(DELIVERY_KEY, s); }

// Cart
export function getCart(): CartItem[] { return get(CART_KEY, []); }
export function saveCart(c: CartItem[]) { set(CART_KEY, c); }

// Reduce stock after transaction
export function reduceStock(items: CartItem[]) {
  const products = getProducts();
  items.forEach(item => {
    const p = products.find(x => x.id === item.product.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.quantity);
      addStockLog({
        id: crypto.randomUUID(),
        productId: p.id,
        productName: p.name,
        change: -item.quantity,
        reason: "Sale",
        createdAt: new Date().toISOString(),
      });
    }
  });
  saveProducts(products);
}

export function generateId(): string { return crypto.randomUUID(); }
