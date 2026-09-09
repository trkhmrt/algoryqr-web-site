"use client";

import { CartSheet } from "./CartSheet";
import { TableBadge } from "./TableBadge";
import { TableUnavailableOverlay } from "./TableUnavailableOverlay";

type SharedMenuChromeProps = {
  publicId: string;
};

export function SharedMenuChrome({ publicId: _publicId }: SharedMenuChromeProps) {
  return (
    <>
      <TableBadge />
      <CartSheet />
      <TableUnavailableOverlay />
    </>
  );
}
