"use client";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SearchCompletePayload } from "@/lib/chef/search-complete";

type MenuChefSearchCompleteProps = {
  visible: boolean;
  payload: SearchCompletePayload;
};

function renderObject(value: Record<string, unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null) continue;
    if (typeof entry === "object" && !Array.isArray(entry)) {
      lines.push(`${pad}${key}:`);
      lines.push(renderObject(entry as Record<string, unknown>, indent + 1));
      continue;
    }
    lines.push(`${pad}${key}: ${JSON.stringify(entry)}`);
  }
  return lines.join("\n");
}

export function MenuChefSearchComplete({ visible, payload }: MenuChefSearchCompleteProps) {
  if (!visible) return null;

  const body = [
    "input",
    renderObject(payload.input as Record<string, unknown>, 1),
    "",
    "response",
    renderObject(payload.response as Record<string, unknown>, 1),
  ].join("\n");

  return (
    <Collapsible className="rounded-xl border border-[#d9e3df] bg-[#f6f9f7]/90">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-medium tracking-[0.02em] text-[#4a5c56]">
        <span>searchComplete</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="max-h-64 overflow-auto border-t border-[#d9e3df] px-3 py-2 text-[11px] leading-relaxed text-[#24302c]">
          {body}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
