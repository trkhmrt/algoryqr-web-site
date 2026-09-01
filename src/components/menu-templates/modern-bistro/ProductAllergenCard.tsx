"use client";

import type { LucideIcon } from "lucide-react";
import { Bean, CircleAlert, Egg, Fish, Milk, Nut, Wheat } from "lucide-react";

import type { MenuAllergenApiItem } from "@/lib/api";
import { Tx } from "@/components/google-translate-provider";

function resolveAllergenIcon(allergen: MenuAllergenApiItem): LucideIcon {
  const key = `${allergen.slug} ${allergen.name}`.toLowerCase();
  if (/gluten|bugday|buğday|wheat|tahil/.test(key)) return Wheat;
  if (/sut|süt|milk|dairy|laktoz|lactose/.test(key)) return Milk;
  if (/yumurta|egg/.test(key)) return Egg;
  if (/findik|fındık|nut|badem|almond|ceviz|walnut/.test(key)) return Nut;
  if (/balik|balık|fish|seafood|deniz/.test(key)) return Fish;
  if (/soya|soy/.test(key)) return Bean;
  return CircleAlert;
}

type ModernBistroProductAllergenCardProps = {
  allergens: MenuAllergenApiItem[];
  title: string;
};

export function ModernBistroProductAllergenCard({
  allergens,
  title,
}: ModernBistroProductAllergenCardProps) {
  if (allergens.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--mb-border)] bg-[var(--mb-surface)] p-4">
      <h2 className="text-base font-bold text-[var(--mb-fg)]">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-4">
        {allergens.map((allergen) => {
          const Icon = resolveAllergenIcon(allergen);
          return (
            <div key={allergen.id} className="flex min-w-[7.5rem] flex-1 items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--mb-border)] bg-[var(--mb-muted-surface)] text-[var(--mb-muted)]">
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span className="text-sm leading-snug text-[var(--mb-fg)]">
                <Tx>{allergen.name}</Tx>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
