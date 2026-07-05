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
  register: (payload: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuthState = useCallback((nextToken: string, nextUser: any) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    
    setSession({
      id: nextUser.id,
      name: nextUser.name,
      email: nextUser.email,
      phone: nextUser.phone,
      kontak: nextUser.phone,
      role: nextUser.role,
      store_id: nextUser.store_id || nextUser.storeId,
      address: nextUser.address,
      token: nextToken,
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
        const me = await fetchCurrentUser();
        // TRANSLATOR: Ubah data MySQL (Indo) ke React (Inggris) saat refresh web
        const normalizedUser = {
          ...me,
          name: me.nama || me.name,
          role: me.peran || me.role,
          phone: me.kontak || me.phone,
          address: me.alamat || me.address,
        };
        applyAuthState(persistedToken, normalizedUser);
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
    // TRANSLATOR: Ubah data MySQL (Indo) ke React (Inggris) saat login
    const normalizedUser = {
      ...result.user,
      name: result.user.nama || result.user.name,
      role: result.user.peran || result.user.role,
      phone: result.user.kontak || result.user.phone,
      address: result.user.alamat || result.user.address,
    };
    
    applyAuthState(result.token, normalizedUser);
    return normalizedUser;
  }, [applyAuthState]);

  const register = useCallback(
    async (payload: any) => {
      const result = await registerUser(payload);
      return result;
    },
    []
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