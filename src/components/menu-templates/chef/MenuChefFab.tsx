"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useTranslatedText } from "@/components/google-translate-provider";
import {
  resolveChefAvatarSrc,
  resolveChefDisplayName,
} from "@/lib/chef/chef-identity";

import { MenuChefChat } from "./MenuChefChat";

type MenuChefFabProps = {
  menuId: number;
  chefName?: string | null;
  chefDisplayName?: string | null;
  chefAvatarUrl?: string | null;
};

export function MenuChefFab({
  menuId,
  chefName,
  chefDisplayName,
  chefAvatarUrl,
}: MenuChefFabProps) {
  const [open, setOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const consultChefLabel = useTranslatedText("Şefe danış");
  const displayName = resolveChefDisplayName(chefDisplayName, chefName);
  const avatarSrc = resolveChefAvatarSrc(chefAvatarUrl);

  useEffect(() => {
    if (!open) return;

    const allowScroll = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("[data-chef-scroll]"));
    };

    const onWheel = (event: WheelEvent) => {
      if (!allowScroll(event.target)) event.preventDefault();
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!allowScroll(event.target)) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      if (!keys.includes(event.key)) return;
      if (!allowScroll(target)) event.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      {chatMounted ? (
        <MenuChefChat
          menuId={menuId}
          chefDisplayName={displayName}
          chefAvatarUrl={avatarSrc}
          open={open}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <motion.button
        type="button"
        onClick={() => {
          setChatMounted(true);
          setOpen(true);
        }}
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto fixed bottom-24 right-4 z-[65] flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-950 py-2.5 pl-2.5 pr-5 text-white shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition hover:scale-[1.03] hover:bg-neutral-900 active:scale-[0.98] lg:right-[max(1rem,calc((100%-28rem)/2+1rem))] disabled:pointer-events-none disabled:hover:scale-100"
        aria-label={`${displayName} ile ${consultChefLabel.toLocaleLowerCase()}`}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        disabled={open}
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <span
            className="animate-chef-fab-pulse absolute inset-0 rounded-full bg-amber-400/50"
            aria-hidden
          />
          <span
            className="animate-chef-fab-pulse absolute inset-0 rounded-full bg-amber-400/35 [animation-delay:1s]"
            aria-hidden
          />
          <span className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-amber-400/90">
            <img
              src={avatarSrc}
              alt=""
              className="h-full w-full object-cover object-top"
            />
          </span>
        </span>
        <span className="flex min-w-0 flex-col items-start gap-0.5 pr-0.5 text-left">
          <span className="text-[13px] font-semibold leading-none tracking-[-0.02em] text-white">
            {displayName}
          </span>
          <span className="text-[11px] font-medium leading-none tracking-[0.01em] text-white/55">
            {consultChefLabel}
          </span>
        </span>
      </motion.button>
    </>
  );
}
