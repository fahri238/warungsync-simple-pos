import { getUsers, login as localLogin, register as localRegister } from "@/lib/store";

const API_BASE_URL = "http://localhost:5000/api/users";

export type BackendRole = "admin" | "pelanggan" | "kurir";
export type FrontendRole = "admin" | "customer" | "courier";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: FrontendRole;
  storeId?: string;
  phone?: string;
  address?: string;
}

interface BackendUser {
  id: string;
  nama: string;
  email: string;
  peran: BackendRole;
  id_toko?: string;
  no_hp?: string;
  alamat?: string;
}

const mapRoleToFrontend = (role: BackendRole): FrontendRole => {
  if (role === "kurir") return "courier";
  if (role === "pelanggan") return "customer";
  return "admin";
};

const mapRoleToBackend = (role: FrontendRole): BackendRole => {
  if (role === "courier") return "kurir";
  if (role === "customer") return "pelanggan";
  return "admin";
};

const mapUser = (user: BackendUser): AuthUser => ({
  id: user.id,
  name: user.nama,
  email: user.email,
  role: mapRoleToFrontend(user.peran),
  storeId: user.id_toko || undefined,
  phone: user.no_hp,
  address: user.alamat,
});

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }
  return data;
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await apiCall("/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        kata_sandi: password,
      }),
    });

    return {
      token: response.data.token as string,
      user: mapUser(response.data.user as BackendUser),
    };
  } catch (error) {
    console.warn("Backend offline, menggunakan data lokal (Demo Mode).");
    const result = localLogin(email, password);
    if (typeof result === "string") throw new Error(result); // result fill it with string error if failed
    return {
      token: `dummy-token-${result.id}`,
      user: result as AuthUser,
    };
  }
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "customer" | "courier";
  address?: string;
}) => {
  try {
    await apiCall("/register", {
      method: "POST",
      body: JSON.stringify({
        nama: payload.name,
        email: payload.email,
        kata_sandi: payload.password,
        no_hp: payload.phone,
        peran: mapRoleToBackend(payload.role),
        alamat: payload.address || undefined,
      }),
    });
    return loginUser(payload.email, payload.password);
  } catch (error) {
    console.warn("Backend offline, menggunakan data lokal (Demo Mode).");
    const result = localRegister(
      payload.name, 
      payload.email, 
      payload.password, 
      payload.phone, 
      payload.role, 
      payload.address
    );
    if (typeof result === "string") throw new Error(result);
    return loginUser(payload.email, payload.password);
  }
};

export const fetchCurrentUser = async (token: string): Promise<AuthUser> => {
  try {
    const response = await apiCall("/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return mapUser(response.data as BackendUser);
  } catch (error) {
    console.warn("Backend offline, menggunakan data lokal (Demo Mode).");
    const id = token.replace("dummy-token-", "");
    const user = getUsers().find(u => u.id === id);
    if (!user) throw new Error("Token tidak valid");
    return user as AuthUser;
  }
};

export const fetchUsersByRole = async (
  role: BackendRole,
): Promise<AuthUser[]> => {
  try {
    const response = await apiCall(`/?role=${role}`, { method: "GET" });
    return (response.data || []).map((user: BackendUser) => mapUser(user));
  } catch (error) {
    console.warn("Backend offline, menggunakan data lokal (Demo Mode).");
    const frontendRole = mapRoleToFrontend(role);
    return getUsers().filter(u => u.role === frontendRole) as AuthUser[];
  }
};