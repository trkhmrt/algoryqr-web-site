"use client";

import { ImageIcon } from "lucide-react";

import type { MenuProductApiItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMenuPrice } from "../types";
import { formatNutritionValue, nutritionBarPercent } from "./category-utils";

type ProductDetailSheetProps = {
  product: MenuProductApiItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function NutriBar({
  label,
  value,
  unit,
  percent,
}: {
  label: string;
  value: string;
  unit: string;
  percent: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] sf-muted">
          {label}
        </span>
        <span className="text-sm font-semibold sf-fg">
          {value}
          <span className="ml-1 text-xs font-normal sf-muted">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--sf-accent-soft)]">
        <div
          className="h-full rounded-full bg-[var(--sf-accent)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function SoftProductDetailSheet({
  product,
  open,
  onOpenChange,
}: ProductDetailSheetProps) {
  const price = product
    ? formatMenuPrice(product.price, product.currency)
    : null;
  const nutrition = product?.nutrition;
  const kcal = formatNutritionValue(nutrition?.energyKcal);
  const protein = formatNutritionValue(nutrition?.protein);
  const fat = formatNutritionValue(nutrition?.fat);
  const carbs = formatNutritionValue(nutrition?.carbohydrate);
  const hasNutrition = Boolean(kcal || protein || fat || carbs);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="soft-menu max-h-[92vh] overflow-y-auto rounded-t-3xl border-[var(--sf-border)] bg-[var(--sf-surface)] p-0"
      >
        {product ? (
          <>
            <div className="relative h-56 w-full overflow-hidden bg-[var(--sf-bg-soft)] sm:h-72">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center sf-muted">
                  <ImageIcon className="h-12 w-12 opacity-30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--sf-surface)] via-transparent to-transparent" />
            </div>

            <div className="relative -mt-10 space-y-5 px-5 pb-8">
              <SheetHeader className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  {!product.available ? (
                    <Badge className="rounded-full border-0 bg-[var(--sf-destructive)] text-white hover:bg-[var(--sf-destructive)]">
                      Tükendi
                    </Badge>
                  ) : null}
                </div>
                <SheetTitle className="font-display text-2xl font-bold leading-tight sf-fg">
                  {product.name}
                </SheetTitle>
                <div className="flex items-end justify-between gap-3">
                  <SheetDescription className="sr-only">
                    Ürün detayı
                  </SheetDescription>
                  {price ? (
                    <p className="font-display text-2xl font-bold sf-fg">{price}</p>
                  ) : null}
                </div>
              </SheetHeader>

              <Tabs defaultValue="nutrition" className="w-full">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl bg-[var(--sf-bg-soft)] p-1">
                  <TabsTrigger
                    value="nutrition"
                    className="rounded-xl data-[state=active]:bg-[var(--sf-surface)] data-[state=active]:shadow-sm"
                  >
                    Besin Değerleri
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="rounded-xl data-[state=active]:bg-[var(--sf-surface)] data-[state=active]:shadow-sm"
                  >
                    Detay
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="nutrition" className="mt-4 space-y-3">
                  {hasNutrition ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {kcal ? (
                        <NutriBar
                          label="Kalori"
                          value={kcal}
                          unit="kcal"
                          percent={nutritionBarPercent(nutrition?.energyKcal, 600)}
                        />
                      ) : null}
                      {protein ? (
                        <NutriBar
                          label="Protein"
                          value={protein}
                          unit="g"
                          percent={nutritionBarPercent(nutrition?.protein, 50)}
                        />
                      ) : null}
                      {fat ? (
                        <NutriBar
                          label="Yağ"
                          value={fat}
                          unit="g"
                          percent={nutritionBarPercent(nutrition?.fat, 40)}
                        />
                      ) : null}
                      {carbs ? (
                        <NutriBar
                          label="Karbonhidrat"
                          value={carbs}
                          unit="g"
                          percent={nutritionBarPercent(nutrition?.carbohydrate, 80)}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-8 text-center text-sm sf-muted">
                      Bu ürün için besin değeri eklenmemiş.
                    </p>
                  )}
                  {nutrition?.basis ? (
                    <p className="text-center text-[11px] uppercase tracking-[0.14em] sf-muted">
                      {nutrition.basis === "PER_100ML"
                        ? "100 ml başına"
                        : "100 g başına"}
                    </p>
                  ) : null}
                </TabsContent>

                <TabsContent value="details" className="mt-4 space-y-4">
                  {product.description ? (
                    <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] sf-muted">
                        Açıklama
                      </p>
                      <p className="text-sm leading-relaxed sf-fg">
                        {product.description}
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-8 text-center text-sm sf-muted">
                      İçindekiler ve özel notlar henüz eklenmemiş.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
