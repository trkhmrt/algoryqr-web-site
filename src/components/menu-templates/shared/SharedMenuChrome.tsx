"use client";

import { CartSheet } from "./CartSheet";

type SharedMenuChromeProps = {
  menuId: number;
};

export function SharedMenuChrome({ menuId: _menuId }: SharedMenuChromeProps) {
  return <CartSheet />;
}
