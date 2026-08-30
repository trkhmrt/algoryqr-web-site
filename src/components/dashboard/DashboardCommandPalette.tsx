"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAccessProfile } from "@/hooks/use-access-profile";
import { hasScope } from "@/lib/auth-user";
import { filterCommandEntries, getDashboardCommandEntries } from "@/lib/dashboard-command";

type DashboardCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardCommandPalette({ open, onOpenChange }: DashboardCommandPaletteProps) {
  const router = useRouter();
  const { data: accessProfile } = useAccessProfile();
  const entries = useMemo(
    () =>
      filterCommandEntries(getDashboardCommandEntries(), "", (scope) =>
        !scope || hasScope(accessProfile, scope),
      ),
    [accessProfile],
  );
  const groups = useMemo(() => {
    const byGroup = new Map<string, typeof entries>();
    for (const entry of entries) {
      const list = byGroup.get(entry.group) ?? [];
      list.push(entry);
      byGroup.set(entry.group, list);
    }
    return [...byGroup.entries()];
  }, [entries]);

  const go = (href: string, external?: boolean) => {
    onOpenChange(false);
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Sayfa veya işlem ara…" />
      <CommandList>
        <CommandEmpty>Sonuç yok.</CommandEmpty>
        {groups.map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => go(item.href, item.external)}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPaletteHotkey(onToggle: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onToggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggle]);
}
