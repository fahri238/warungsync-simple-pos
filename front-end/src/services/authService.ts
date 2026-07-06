import { apiFetch } from "@/lib/store";

export interface AuthUser {
  id: string | number;
  name?: string;
  nama?: string;
  email: string;
  phone?: string;
  kontak?: string;
  role?: string;
  peran?: string;
  storeId?: string | number | null;
  store_id?: string | number | null;
  address?: string;
  alamat?: string;
}

export const loginUser = async (email: string, password: string) => {
  const res = await apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, kata_sandi: password }),
  });
  return { token: res.data.token, user: res.data.user };
};

export const registerUser = async (payload: any) => {
  const res = await apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data; 
};

export const fetchCurrentUser = async () => {
  // PERBAIKAN: Memastikan rute mengarah ke /users/me, bukan /users/login
  const res = await apiFetch("/users/me");
  return res.data;
};

export const fetchUsersByRole = async (role: string) => {
  try {
    const res = await apiFetch(`/users?role=${role}`);
    return res.data || [];
  } catch (error) {
    console.error(`Gagal mengambil data user dengan role ${role}:`, error);
    return [];
  }
};