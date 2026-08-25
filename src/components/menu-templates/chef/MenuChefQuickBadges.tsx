"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import type { ChefChatBadge } from "@/lib/chef/chef-chat-badges";

type MenuChefQuickBadgesProps = {
  menuId: number;
  disabled?: boolean;
  onSelect: (badge: ChefChatBadge) => void;
};

const badgeIcons: Record<string, typeof Sparkles> = {
  chef_recommended: Sparkles,
  popular: TrendingUp,
};

export function MenuChefQuickBadges({
  menuId,
  disabled = false,
  onSelect,
}: MenuChefQuickBadgesProps) {
  const [badges, setBadges] = useState<ChefChatBadge[]>([]);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/menu/chef/badges?menuId=${menuId}`)
      .then((res) => res.json())
      .then((data: { badges?: ChefChatBadge[] }) => {
        if (cancelled) return;
        setBadges(Array.isArray(data.badges) ? data.badges : []);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      });

    return () => {
      cancelled = true;
    };
  }, [menuId]);

  if (badges.length === 0) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-wrap gap-2 px-1 pb-2">
      {badges.map((badge, index) => {
        const Icon = badgeIcons[badge.id] ?? Sparkles;
        return (
          <motion.button
            key={badge.id}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.22 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(badge)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#1c2824]/10 bg-white/85 px-3 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] text-[#2a3833] shadow-[0_4px_14px_rgba(28,40,36,0.04)] backdrop-blur-sm transition hover:border-[#2a3833]/20 hover:bg-white disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon className="h-3.5 w-3.5 text-[#5f7a6d]" strokeWidth={2.25} />
            {badge.label}
          </motion.button>
        );
      })}
    </div>
  );
}
