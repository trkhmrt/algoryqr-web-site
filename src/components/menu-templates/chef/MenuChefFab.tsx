"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { MenuChefChat } from "./MenuChefChat";

type MenuChefFabProps = {
  menuId: number;
};

export function MenuChefFab({ menuId }: MenuChefFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <MenuChefChat
        menuId={menuId}
        open={open}
        onClose={() => setOpen(false)}
      />
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto fixed bottom-5 right-4 z-[65] flex items-center gap-2 rounded-full bg-[#1c1917] py-2.5 pl-3 pr-3.5 text-white shadow-[0_12px_40px_rgba(28,25,23,0.35)] transition hover:scale-[1.03] active:scale-[0.98] lg:right-[max(1rem,calc((100vw-28rem)/2+1rem))]"
          aria-label="Şefe danış"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-amber-500">
            <MessageCircle className="h-4 w-4" strokeWidth={2.2} />
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
          </span>
          <span className="text-sm font-semibold tracking-wide">Şefe danış</span>
        </button>
      ) : null}
    </>
  );
}
