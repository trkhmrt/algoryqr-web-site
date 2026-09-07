"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import {
  resolveChefAvatarSrc,
  resolveChefDisplayName,
} from "@/lib/chef/chef-identity";

import { MenuChefChat } from "../chef/MenuChefChat";
import { useMenuLocale } from "../shared/menu-locale";

type KahveChefAskButtonProps = {
  publicId: string;
  chefName?: string | null;
  chefDisplayName?: string | null;
  chefAvatarUrl?: string | null;
};

export function KahveChefAskButton({
  publicId,
  chefName,
  chefDisplayName,
  chefAvatarUrl,
}: KahveChefAskButtonProps) {
  const [open, setOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const { t } = useMenuLocale();
  const label = t.askChef;
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
          publicId={publicId}
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
        className="ks-ai-ask-btn"
        aria-label={label}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        disabled={open}
      >
        <span className="ks-ai-ask-btn__shell">
          <span className="ks-ai-ask-btn__dot" aria-hidden />
          <Sparkles className="ks-ai-ask-btn__spark" strokeWidth={2} aria-hidden />
          <span className="ks-ai-ask-btn__label">{label}</span>
        </span>
      </button>
    </>
  );
}
