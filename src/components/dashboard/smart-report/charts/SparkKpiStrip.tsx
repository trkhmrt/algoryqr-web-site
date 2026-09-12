"use client";

import { CreditCard, DollarSign, RotateCcw, UserPlus, Users, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { SparkKpi } from "../shadcn-spark";
import { MiniLineSpark } from "./FadeLineSpark";
import { DeltaText } from "./DeltaPill";

const ICONS: Record<SparkKpi["icon"], LucideIcon> = {
  users: Users,
  userPlus: UserPlus,
  repeat: RotateCcw,
  wallet: DollarSign,
  card: CreditCard,
};

export function SparkKpiStrip({ items }: { items: SparkKpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <SparkKpiCard key={item.title} item={item} />
      ))}
    </div>
  );
}

function SplitList({ splits }: { splits?: SparkKpi["splits"] }) {
  if (!splits || splits.length === 0) return null;
  return (
    <ul className="space-y-1 border-t border-border/60 pt-2">
      {splits.map((split) => (
        <li key={split.label} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{split.label}</span>
          <span className="truncate font-medium tabular-nums text-foreground">{split.value}</span>
        </li>
      ))}
    </ul>
  );
}

function SparkKpiCard({ item }: { item: SparkKpi }) {
  const Icon = ICONS[item.icon];
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.title}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tabular-nums tracking-tight">{item.value}</p>
          <DeltaText value={item.delta} />
        </div>
        <MiniLineSpark values={item.series} className="-mx-1 h-12 w-[calc(100%+0.5rem)]" />
        <SplitList splits={item.splits} />
      </CardContent>
    </Card>
  );
}
