"use client";

import type { ReactNode } from "react";

import type { MenuProductApiItem } from "@/lib/api";

import {
  MenuProductFeedContext,
  useMenuProductFeedState,
} from "./use-public-menu-products";

type MenuProductFeedProps = {
  menuId: number;
  initialProducts: MenuProductApiItem[];
  productPage?: number;
  productSize?: number;
  productHasNext?: boolean;
  children: ReactNode;
};

export function MenuProductFeed({
  menuId,
  initialProducts,
  productPage = 0,
  productSize = 20,
  productHasNext = false,
  children,
}: MenuProductFeedProps) {
  const value = useMenuProductFeedState({
    menuId,
    initialProducts,
    initialPage: productPage,
    initialSize: productSize,
    initialHasNext: productHasNext,
  });

  return (
    <MenuProductFeedContext.Provider value={value}>{children}</MenuProductFeedContext.Provider>
  );
}
