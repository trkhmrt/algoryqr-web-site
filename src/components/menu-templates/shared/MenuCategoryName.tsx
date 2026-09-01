"use client";

import { Tx } from "@/components/google-translate-provider";

export function MenuCategoryName({ name }: { name: string }) {
  return <Tx>{name}</Tx>;
}
