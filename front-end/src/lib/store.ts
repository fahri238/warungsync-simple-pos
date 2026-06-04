import {
  Product,
  Category,
  Order,
  StockLog,
  DeliverySettings,
  OrderItem,
  Delivery,
} from "@/types";
import { defaultProductImages } from "@/lib/product-images";
import * as productService from "@/services/productService";

const PRODUCTS_KEY = "warungsync_products";
const CATEGORIES_KEY = "warungsync_categories";
const ORDERS_KEY = "warungsync_orders";
const STOCK_LOGS_KEY = "warungsync_stock_logs";
const DELIVERY_KEY = "warungsync_delivery";
const CART_KEY = "warungsync_cart";
const CART_BY_STORE_KEY = "warungsync_cart_by_store";
const USERS_KEY = "warungsync_users";
const SESSION_KEY = "warungsync_session";
const DELIVERIES_KEY = "warungsync_deliveries";

const defaultCategories: Category[] = [
  { id: "cat-1", name: "Makanan" },
  { id: "cat-2", name: "Minuman" },
  { id: "cat-3", name: "Snack" },
  { id: "cat-4", name: "Lainnya" },
];

const defaultProducts: Product[] = [
  {
    id: "p-1",
    name: "Nasi Goreng",
    price: 15000,
    stock: 50,
    category: "cat-1",
    image: "",
    description: "Nasi goreng spesial dengan telur dan ayam",
  },
  {
    id: "p-2",
    name: "Mie Goreng",
    price: 13000,
    stock: 40,
    category: "cat-1",
    image: "",
    description: "Mie goreng dengan sayuran segar",
  },
  {
    id: "p-3",
    name: "Ayam Goreng",
    price: 18000,
    stock: 30,
    category: "cat-1",
    image: "",
    description: "Ayam goreng crispy renyah",
  },
  {
    id: "p-4",
    name: "Soto Ayam",
    price: 12000,
    stock: 25,
    category: "cat-1",
    image: "",
    description: "Soto ayam kuah bening",
  },
  {
    id: "p-5",
    name: "Es Teh Manis",
    price: 5000,
    stock: 100,
    category: "cat-2",
    image: "",
    description: "Es teh manis segar",
  },
  {
    id: "p-6",
    name: "Es Jeruk",
    price: 7000,
    stock: 80,
    category: "cat-2",
    image: "",
    description: "Es jeruk peras segar",
  },
  {
    id: "p-7",
    name: "Kopi",
    price: 8000,
    stock: 60,
    category: "cat-2",
    image: "",
    description: "Kopi tubruk khas",
  },
  {
    id: "p-8",
    name: "Kerupuk",
    price: 3000,
    stock: 200,
    category: "cat-3",
    image: "",
    description: "Kerupuk renyah",
  },
  {
    id: "p-9",
    name: "Gorengan",
    price: 5000,
    stock: 70,
    category: "cat-3",
    image: "",
    description: "Aneka gorengan hangat",
  },
  {
    id: "p-10",
    name: "Nasi Putih",
    price: 5000,
    stock: 100,
    category: "cat-4",
    image: "",
    description: "Nasi putih hangat",
  },
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

// ---- User (Class Diagram: User) ----
export interface User {
  id: string;
  storeId?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: "admin" | "customer" | "courier";
  address?: string;
}

export const DEFAULT_STORE_ID = "store-mama-eva";

const defaultUsers: User[] = [
  {
    id: "admin-1",
    name: "Admin",
    email: "admin@warungmamaeva.com",
    password: "admin123",
    phone: "08123456789",
    role: "admin",
  },
  {
    id: "courier-1",
    name: "Kurir Andi",
    email: "kurir@warungmamaeva.com",
    password: "kurir123",
    phone: "08198765432",
    role: "courier",
    address: "Jl. Merdeka No. 10, Jakarta",
  },
  {
    id: "customer-1",
    name: "Budi Santoso",
    email: "customer@warungmamaeva.com",
    password: "customer123",
    phone: "08112233445",
    role: "customer",
    address: "Jl. Sudirman No. 5, Jakarta",
  },
];

export function getUsers(): User[] {
  const users = get(USERS_KEY, defaultUsers);
  // Ensure all default accounts always exist
  let changed = false;
  for (const def of defaultUsers) {
    if (!users.find((u) => u.email === def.email)) {
      users.push(def);
      changed = true;
    }
  }
  if (changed) saveUsers(users);
  return users;
}
export function saveUsers(u: User[]) {
  set(USERS_KEY, u);
}

// UserModel.findUserByEmail(email): userData / null
export function findUserByEmail(email: string): User | null {
  const users = getUsers();
  return users.find((u) => u.email === email) || null;
}

// AuthController.verifyPassword(password, hash): Boolean
export function verifyPassword(
  inputPassword: string,
  storedPassword: string,
): boolean {
  return inputPassword === storedPassword;
}

// AuthController.generateToken(): sets session
export function generateToken(user: User): void {
  setSession(user);
}

// User.login(): Boolean (composite - kept for backward compatibility)
export function login(email: string, password: string): User | string {
  const userData = findUserByEmail(email);
  if (!userData) return "Email atau password salah";
  if (!verifyPassword(password, userData.password))
    return "Email atau password salah";
  return userData;
}

// User.register(): Boolean
export function register(
  name: string,
  email: string,
  password: string,
  phone: string,
  role: "customer" | "courier" = "customer",
  address?: string,
): User | string {
  const users = getUsers();
  if (users.find((u) => u.email === email)) return "Email sudah terdaftar";
  const user: User = {
    id: generateId(),
    name,
    email,
    password,
    phone,
    role,
    address,
  };
  users.push(user);
  saveUsers(users);
  return user;
}

// User.updateProfile(): Void
export function updateProfile(
  userId: string,
  updates: Partial<Omit<User, "id" | "role">>,
): User | string {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return "User tidak ditemukan";
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}

export function getSession(): User | null {
  return get(SESSION_KEY, null);
}

export function setSession(user: User | null) {
  if (user) set(SESSION_KEY, user);
  else localStorage.removeItem(SESSION_KEY);
}

// ---- Product (Class Diagram: Product) ----

// Helper: get the display image for a product
export function getProductImage(product: Product): string {
  if (product.image && product.image.length > 5) return product.image;
  return defaultProductImages[product.id] || "/placeholder.svg";
}

// Product.getDetails(): Object
export function getProductDetails(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

// Product.updateStock(amount: INT): Boolean
export function updateStock(items: OrderItem[]): boolean {
  const products = getProducts();
  items.forEach((item) => {
    const p = products.find((x) => x.id === item.product.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.quantity);
      recordStockLog({
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
  return true;
}

// API-based product functions
let _cachedProducts: Product[] | null = null;
let _productsLoading = false;

export async function getProductsFromAPI(storeId?: string): Promise<Product[]> {
  if (_cachedProducts && !storeId) return _cachedProducts;

  try {
    _productsLoading = true;
    const products = await productService.fetchProducts(storeId);
    if (!storeId) {
      _cachedProducts = products;
    }
    // Also update localStorage as backup
    if (!storeId) saveProducts(products);
    return products;
  } catch (error) {
    console.warn(
      "Failed to fetch products from API, using localStorage:",
      error,
    );
    return getProducts();
  } finally {
    _productsLoading = false;
  }
}

export function setProductsCache(products: Product[]) {
  _cachedProducts = products;
  saveProducts(products);
}

export async function addProductToAPI(
  product: Omit<Product, "id">,
): Promise<Product> {
  try {
    const newProduct = await productService.createProduct(product as any);
    // Invalidate cache
    _cachedProducts = null;
    return newProduct;
  } catch (error) {
    console.error("Failed to add product:", error);
    throw error;
  }
}

export async function updateProductInAPI(
  id: string,
  product: Omit<Product, "id">,
): Promise<Product> {
  try {
    const updatedProduct = await productService.updateProduct(
      id,
      product as any,
    );
    // Invalidate cache
    _cachedProducts = null;
    return updatedProduct;
  } catch (error) {
    console.error("Failed to update product:", error);
    throw error;
  }
}

export async function deleteProductFromAPI(id: string): Promise<void> {
  try {
    await productService.deleteProduct(id);
    // Invalidate cache
    _cachedProducts = null;
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
}

// Fallback localStorage functions (deprecated, use API functions instead)
export function getProducts(): Product[] {
  return get(PRODUCTS_KEY, defaultProducts);
}
export function saveProducts(p: Product[]) {
  set(PRODUCTS_KEY, p);
}
export function addProduct(p: Product) {
  const all = getProducts();
  all.push(p);
  saveProducts(all);
}
export function updateProduct(p: Product) {
  saveProducts(getProducts().map((x) => (x.id === p.id ? p : x)));
}
export function deleteProduct(id: string) {
  saveProducts(getProducts().filter((x) => x.id !== id));
}

// ---- Category (Class Diagram: Category) ----

// Category.getProducts(): Array
export function getCategoryProducts(categoryId: string): Product[] {
  return getProducts().filter((p) => p.category === categoryId);
}

// API-based category functions
let _cachedCategories: Category[] | null = null;
let _categoriesLoading = false;

export async function getCategoriesFromAPI(storeId?: string): Promise<Category[]> {
  if (_cachedCategories && !storeId) return _cachedCategories;

  try {
    _categoriesLoading = true;
    const categories = await productService.fetchCategories(storeId);
    if (!storeId) _cachedCategories = categories;
    // Also update localStorage as backup
    if (!storeId) saveCategories(categories);
    return categories;
  } catch (error) {
    console.warn(
      "Failed to fetch categories from API, using localStorage:",
      error,
    );
    return getCategories();
  } finally {
    _categoriesLoading = false;
  }
}

export function setCategoriesCache(categories: Category[]) {
  _cachedCategories = categories;
  saveCategories(categories);
}

export async function addCategoryToAPI(
  category: Omit<Category, "id">,
): Promise<Category> {
  try {
    const newCategory = await productService.createCategory(category as any);
    // Invalidate cache
    _cachedCategories = null;
    return newCategory;
  } catch (error) {
    console.error("Failed to add category:", error);
    throw error;
  }
}

export async function deleteCategoryFromAPI(id: string): Promise<void> {
  try {
    await productService.deleteCategory(id);
    // Invalidate cache
    _cachedCategories = null;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
}

// Fallback localStorage functions (deprecated, use API functions instead)
export function getCategories(): Category[] {
  return get(CATEGORIES_KEY, defaultCategories);
}
export function saveCategories(c: Category[]) {
  set(CATEGORIES_KEY, c);
}
// Category.addCategory(): Boolean
export function addCategory(c: Category) {
  const all = getCategories();
  all.push(c);
  saveCategories(all);
}
export function updateCategory(c: Category) {
  saveCategories(getCategories().map((x) => (x.id === c.id ? c : x)));
}
export function deleteCategory(id: string) {
  saveCategories(getCategories().filter((x) => x.id !== id));
}

// ---- Order (Class Diagram: Order) ----

// Order.calculateTotal(): DECIMAL
export function calculateTotal(items: OrderItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
}

// Order.updateStatus(newStatus: String): Boolean
export function updateOrderStatus(orderId: string, newStatus: string): boolean {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return false;
  order.status = newStatus as Order["status"];
  saveOrders(orders);
  return true;
}

export function getOrders(): Order[] {
  return get(ORDERS_KEY, []);
}
export function saveOrders(o: Order[]) {
  set(ORDERS_KEY, o);
}
export function addOrder(o: Order) {
  const all = getOrders();
  all.unshift(o);
  saveOrders(all);
}
export function updateOrder(o: Order) {
  saveOrders(getOrders().map((x) => (x.id === o.id ? o : x)));
}

// ---- OrderItem (Class Diagram: OrderItem) ----

// OrderItem.getSubtotal(): DECIMAL
export function getSubtotal(item: OrderItem): number {
  return item.product.price * item.quantity;
}

// ---- StockLog (Class Diagram: StockLog) ----

export function getStockLogs(): StockLog[] {
  return get(STOCK_LOGS_KEY, []);
}

// StockLog.recordLog(): Boolean
export function recordStockLog(log: StockLog) {
  const all = getStockLogs();
  all.unshift(log);
  set(STOCK_LOGS_KEY, all);
}

// ---- Delivery (Class Diagram: Delivery) ----

export function getDeliveries(): Delivery[] {
  return get(DELIVERIES_KEY, []);
}
export function addDelivery(d: Delivery) {
  const all = getDeliveries();
  all.unshift(d);
  set(DELIVERIES_KEY, all);
}

// Delivery.updateDeliveryStatus(): Boolean
export function updateDeliveryStatus(
  deliveryId: string,
  status: Delivery["status"],
): boolean {
  const all = getDeliveries();
  const d = all.find((x) => x.id === deliveryId);
  if (!d) return false;
  d.status = status;
  d.updatedAt = new Date().toISOString();
  set(DELIVERIES_KEY, all);
  return true;
}

// ---- DeliverySettings ----
export function getDeliverySettings(): DeliverySettings {
  return get(DELIVERY_KEY, { enabled: true });
}
export function saveDeliverySettings(s: DeliverySettings) {
  set(DELIVERY_KEY, s);
}

// ---- Cart (per-store; no cross-store mixing) ----
type CartByStore = Record<string, OrderItem[]>;

function migrateLegacyCart(): CartByStore {
  const legacy = get<OrderItem[]>(CART_KEY, []);
  const byStore = get<CartByStore>(CART_BY_STORE_KEY, {});
  if (legacy.length > 0 && Object.keys(byStore).length === 0) {
    byStore[DEFAULT_STORE_ID] = legacy;
    set(CART_BY_STORE_KEY, byStore);
    localStorage.removeItem(CART_KEY);
  }
  return byStore;
}

export function getCart(storeId: string): OrderItem[] {
  const byStore = migrateLegacyCart();
  return byStore[storeId] || [];
}

export function saveCart(storeId: string, items: OrderItem[]) {
  const byStore = migrateLegacyCart();
  if (items.length === 0) {
    delete byStore[storeId];
  } else {
    byStore[storeId] = items;
  }
  set(CART_BY_STORE_KEY, byStore);
}

export function clearOtherStoreCarts(activeStoreId: string) {
  const byStore = migrateLegacyCart();
  const active = byStore[activeStoreId];
  const next: CartByStore = active ? { [activeStoreId]: active } : {};
  set(CART_BY_STORE_KEY, next);
}

export function generateId(): string {
  return crypto.randomUUID();
}
