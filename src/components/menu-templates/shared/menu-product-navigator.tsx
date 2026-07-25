"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import type { MenuProductApiItem } from "@/lib/api";

type OpenProductHandler = (product: MenuProductApiItem) => void;

type MenuProductNavigatorValue = {
  registerOpenProduct: (handler: OpenProductHandler) => () => void;
  openProduct: (product: MenuProductApiItem) => void;
};

const MenuProductNavigatorContext = createContext<MenuProductNavigatorValue | null>(
  null,
);

export function MenuProductNavigatorProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<OpenProductHandler | null>(null);

  const registerOpenProduct = useCallback((handler: OpenProductHandler) => {
    handlerRef.current = handler;
    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
      }
    };
  }, []);

  const openProduct = useCallback((product: MenuProductApiItem) => {
    handlerRef.current?.(product);
  }, []);

  const value = useMemo(
    () => ({ registerOpenProduct, openProduct }),
    [registerOpenProduct, openProduct],
  );

  return (
    <MenuProductNavigatorContext.Provider value={value}>
      {children}
    </MenuProductNavigatorContext.Provider>
  );
}

export function useMenuProductNavigator() {
  const ctx = useContext(MenuProductNavigatorContext);
  if (!ctx) {
    throw new Error("useMenuProductNavigator must be used within MenuProductNavigatorProvider");
  }
  return ctx;
}

export function useMenuProductNavigatorOptional() {
  return useContext(MenuProductNavigatorContext);
}
