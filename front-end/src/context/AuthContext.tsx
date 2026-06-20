import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  type AuthUser,
} from "@/services/authService";
import { setSession } from "@/lib/store";

const TOKEN_STORAGE_KEY = "warungsync_token";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: "customer" | "courier";
    address?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthState = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setSession({
      id: nextUser.id,
      name: nextUser.name,
      email: nextUser.email,
      phone: nextUser.phone || "",
      role: nextUser.role,
      storeId: nextUser.storeId,
      address: nextUser.address,
    });
  }, []);

  const clearAuthState = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setSession(null);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const persistedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!persistedToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await fetchCurrentUser(persistedToken);
        applyAuthState(persistedToken, me);
      } catch {
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [applyAuthState, clearAuthState]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser(email, password);
    applyAuthState(result.token, result.user);
    return result.user;
  }, [applyAuthState]);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone: string;
      role: "customer" | "courier";
      address?: string;
    }) => {
      const result = await registerUser(payload);
      applyAuthState(result.token, result.user);
      return result.user;
    },
    [applyAuthState],
  );

  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
