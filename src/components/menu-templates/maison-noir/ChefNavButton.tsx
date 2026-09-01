"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { useTranslatedText } from "@/components/google-translate-provider";
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
  const askChefLabel = useTranslatedText("Bana sor");
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

  const openChat = () => {
    setChatMounted(true);
    setOpen(true);
  };

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
        onClick={openChat}
        className="mn-ai-ask-btn group"
        aria-label={askChefLabel}
      >
        <span className="mn-ai-ask-btn__inner">
          <Sparkles className="mn-ai-ask-btn__spark h-3 w-3 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{askChefLabel}</span>
        </span>
      </button>
    </>
  );
}
