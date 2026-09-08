"use client";

import { CartSheet } from "./CartSheet";
import { TableBadge } from "./TableBadge";

type SharedMenuChromeProps = {
  publicId: string;
};

export function SharedMenuChrome({ publicId: _publicId }: SharedMenuChromeProps) {
  return (
    <>
      <TableBadge />
      <CartSheet />
    </>
  );
}
