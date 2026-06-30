import { apiFetch } from "@/lib/store";

export type BackendRole = "admin" | "pelanggan" | "kurir";
export type FrontendRole = "admin" | "customer" | "courier";

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role: FrontendRole;
  storeId?: string | number;
  phone?: string;
  address?: string;
}

// Representasi data mentah yang dikirim oleh authController.js backend
interface BackendUser {
  id: string | number;
  nama: string;
  email: string;
  peran: BackendRole;
  store_id?: string | number | null; // DISESUAIKAN: id_toko -> store_id
  kontak?: string;                    // DISESUAIKAN: no_hp -> kontak
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

// Fungsi pemetaan untuk menyamakan objek database backend ke properti komponen React frontend
const mapUser = (user: BackendUser): AuthUser => ({
  id: user.id,
  name: user.nama,
  email: user.email,
  role: mapRoleToFrontend(user.peran),
  storeId: user.store_id || undefined, // DISESUAIKAN: id_toko -> store_id
  phone: user.kontak,                  // DISESUAIKAN: no_hp -> kontak
  address: user.alamat,
});

// ================= FUNGSI PROSES LOGIN =================
export const loginUser = async (email: string, password: string) => {
  const response = await apiFetch("/users/login", {
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

// ================= FUNGSI PROSES REGISTRASI =================
export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "customer" | "courier" | "admin";
  address?: string;
  storeId?: string | number | null;
}) => {
  await apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify({
      nama: payload.name,
      email: payload.email,
      kata_sandi: payload.password,
      kontak: payload.phone, // DISESUAIKAN: no_hp -> kontak
      peran: mapRoleToBackend(payload.role),
      alamat: payload.address || undefined,
      store_id: payload.storeId || null,
    }),
  });
  
  // Otomatis lakukan login setelah berhasil mendaftar
  return loginUser(payload.email, payload.password);
};

// ================= FUNGSI AMBIL PROFIL USER AKTIF =================
export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiFetch("/users/me", {
    method: "GET",
  });
  return mapUser(response.data as BackendUser);
};

// ================= FUNGSI AMBIL PENGGUNA BERDASARKAN ROLE =================
export const fetchUsersByRole = async (role: FrontendRole): Promise<AuthUser[]> => {
  const backendRole = mapRoleToBackend(role);
  const response = await apiFetch(`/users?role=${backendRole}`, { 
    method: "GET" 
  });
  
  return (response.data || []).map((user: BackendUser) => mapUser(user));
};