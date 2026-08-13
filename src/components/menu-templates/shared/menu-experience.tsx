"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MenuProductApiItem } from "@/lib/api";

import type { MenuLandingAction } from "./menu-landing";
import { useMenuProductNavigatorOptional } from "./menu-product-navigator";

export type MenuExperienceStage = "welcome" | "menu";

export type MenuWelcomePanel = Exclude<MenuLandingAction, "menu"> | "landing";

type MenuExperienceValue = {
  stage: MenuExperienceStage;
  welcomePanel: MenuWelcomePanel;
  enterMenu: () => void;
  exitToWelcome: () => void;
  selectWelcomeAction: (action: MenuLandingAction) => void;
  backToLandingHub: () => void;
  pendingProduct: MenuProductApiItem | null;
  clearPendingProduct: () => void;
};

const MenuExperienceContext = createContext<MenuExperienceValue | null>(null);

export function MenuExperienceProvider({
  children,
  initialStage = "welcome",
}: {
  children: ReactNode;
  initialStage?: MenuExperienceStage;
}) {
  const navigator = useMenuProductNavigatorOptional();
  const [stage, setStage] = useState<MenuExperienceStage>(initialStage);
  const [welcomePanel, setWelcomePanel] = useState<MenuWelcomePanel>("landing");
  const [pendingProduct, setPendingProduct] = useState<MenuProductApiItem | null>(null);

  const enterMenu = useCallback(() => {
    setStage("menu");
  }, []);

  const exitToWelcome = useCallback(() => {
    setStage("welcome");
    setWelcomePanel("landing");
  }, []);

  const backToLandingHub = useCallback(() => {
    setStage("welcome");
    setWelcomePanel("landing");
  }, []);

  const selectWelcomeAction = useCallback((action: MenuLandingAction) => {
    if (action === "menu") {
      setStage("menu");
      return;
    }
    setStage("welcome");
    setWelcomePanel(action);
  }, []);

  const clearPendingProduct = useCallback(() => {
    setPendingProduct(null);
  }, []);

  useEffect(() => {
    if (!navigator || stage === "menu") return;
    return navigator.registerOpenProduct((product) => {
      setPendingProduct(product);
      setStage("menu");
    });
  }, [navigator, stage]);

  const value = useMemo<MenuExperienceValue>(
    () => ({
      stage,
      welcomePanel,
      enterMenu,
      exitToWelcome,
      selectWelcomeAction,
      backToLandingHub,
      pendingProduct,
      clearPendingProduct,
    }),
    [
      backToLandingHub,
      clearPendingProduct,
      enterMenu,
      exitToWelcome,
      pendingProduct,
      selectWelcomeAction,
      stage,
      welcomePanel,
    ],
  );

  return (
    <MenuExperienceContext.Provider value={value}>{children}</MenuExperienceContext.Provider>
  );
}

export function useMenuExperience() {
  const ctx = useContext(MenuExperienceContext);
  if (!ctx) {
    throw new Error("useMenuExperience must be used within MenuExperienceProvider");
  }
  return ctx;
}

export function useMenuExperienceOptional() {
  return useContext(MenuExperienceContext);
}
