"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import {
  resolveChefAvatarSrc,
  resolveChefDisplayName,
} from "@/lib/chef/chef-identity";

import { MenuChefChat } from "../chef/MenuChefChat";

type MaisonNoirChefNavButtonProps = {
  menuId: number;
  chefName?: string | null;
  chefDisplayName?: string | null;
  chefAvatarUrl?: string | null;
};

export function MaisonNoirChefNavButton({
  menuId,
  chefName,
  chefDisplayName,
  chefAvatarUrl,
}: MaisonNoirChefNavButtonProps) {
  const [open, setOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
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
      <button
        type="button"
        onClick={() => {
          setChatMounted(true);
          setOpen(true);
        }}
        className="mn-chef-nav-btn mn-chef-nav-btn--pill group relative inline-flex max-w-[min(46vw,9.5rem)] shrink-0"
        aria-label="Akıllı Şefe Sor"
      >
        <span className="mn-chef-nav-btn__ring absolute inset-0 rounded-full" aria-hidden />
        <span className="mn-chef-nav-btn__glow absolute inset-0 rounded-full opacity-70" aria-hidden />
        <span className="relative flex min-h-8 items-center gap-1.5 rounded-full bg-[var(--mn-bg)]/92 py-0.5 pl-0.5 pr-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mn-surface)]/80">
            <Sparkles
              className="h-3 w-3 text-[var(--mn-fg)] transition-transform group-hover:scale-110 group-active:scale-95"
              strokeWidth={1.5}
            />
          </span>
          <span className="truncate mn-type-label text-[0.625rem] leading-none text-[var(--mn-fg)]">
            Akıllı Şefe Sor
          </span>
        </span>
      </button>
    </>
  );
}
