"use client";

import type { ReactNode } from "react";

import type { MenuProductApiItem } from "@/lib/api";

import {
  MenuProductFeedContext,
  useMenuProductFeedState,
} from "./use-public-menu-products";

type MenuProductFeedProps = {
  publicId: string;
  initialProducts: MenuProductApiItem[];
  productPage?: number;
  productSize?: number;
  productHasNext?: boolean;
  children: ReactNode;
};

export function MenuProductFeed({
  publicId,
  initialProducts,
  productPage = 0,
  productSize = 20,
  productHasNext = false,
  children,
}: MenuProductFeedProps) {
  const value = useMenuProductFeedState({
    publicId,
    initialProducts,
    initialPage: productPage,
    initialSize: productSize,
    initialHasNext: productHasNext,
  });

  return (
    <MenuProductFeedContext.Provider value={value}>{children}</MenuProductFeedContext.Provider>
  );
}
