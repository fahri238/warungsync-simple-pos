import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Store } from "@/services/storeService";

const SELECTED_STORE_KEY = "warungsync_selected_store";

interface StoreContextValue {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  clearSelectedStore: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_STORE_KEY);
      return raw ? (JSON.parse(raw) as Store) : null;
    } catch {
      return null;
    }
  });

  const setSelectedStore = useCallback((store: Store | null) => {
    setSelectedStoreState(store);
    if (store) {
      localStorage.setItem(SELECTED_STORE_KEY, JSON.stringify(store));
    } else {
      localStorage.removeItem(SELECTED_STORE_KEY);
    }
  }, []);

  const clearSelectedStore = useCallback(() => {
    setSelectedStore(null);
  }, [setSelectedStore]);

  const value = useMemo(
    () => ({ selectedStore, setSelectedStore, clearSelectedStore }),
    [selectedStore, setSelectedStore, clearSelectedStore],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStoreContext must be used within StoreProvider");
  }
  return ctx;
};
