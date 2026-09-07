"use client";

import { CartSheet } from "./CartSheet";

type SharedMenuChromeProps = {
  publicId: string;
};

export function SharedMenuChrome({ publicId: _publicId }: SharedMenuChromeProps) {
  return <CartSheet />;
}
