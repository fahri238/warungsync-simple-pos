const API_BASE_URL = "http://localhost:5000/api/users";

export type BackendRole = "admin" | "pelanggan" | "kurir";
export type FrontendRole = "admin" | "customer" | "courier";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: FrontendRole;
  phone?: string;
  address?: string;
}

interface BackendUser {
  id: string;
  nama: string;
  email: string;
  peran: BackendRole;
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
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "customer" | "courier";
  address?: string;
}) => {
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

  // Auto-login after successful register for smoother UX.
  return loginUser(payload.email, payload.password);
};

export const fetchCurrentUser = async (token: string): Promise<AuthUser> => {
  const response = await apiCall("/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return mapUser(response.data as BackendUser);
};

export const fetchUsersByRole = async (
  role: BackendRole,
): Promise<AuthUser[]> => {
  const response = await apiCall(`/?role=${role}`, { method: "GET" });
  return (response.data || []).map((user: BackendUser) => mapUser(user));
};
