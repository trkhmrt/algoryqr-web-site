"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MainCategoryApiItem, SubCategoryApiItem } from "@/lib/api";
import { useMenuTaxonomy } from "@/hooks/use-menu-categories";

type MenuCategoriesPanelProps = {
  menuId: number;
  qrId: number;
  onAddProduct?: (subCategoryId: number) => void;
};

function SubRow({
  sub,
  onAddProduct,
}: {
  sub: SubCategoryApiItem;
  onAddProduct?: (subCategoryId: number) => void;
}) {
  return (
    <div className="ml-4 flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{sub.name}</span>
        <span className="truncate text-xs text-muted-foreground">{sub.slug}</span>
      </div>
      {onAddProduct ? (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onAddProduct(sub.id)}>
          Ürün ekle
        </Button>
      ) : null}
    </div>
  );
}

function MainBlock({
  main,
  onAddProduct,
}: {
  main: MainCategoryApiItem;
  onAddProduct?: (subCategoryId: number) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/80 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{main.name}</h3>
        <span className="text-xs text-muted-foreground">{main.slug}</span>
      </div>
      <div className="space-y-2">
        {(main.subs ?? []).map((sub) => (
          <SubRow key={sub.id} sub={sub} onAddProduct={onAddProduct} />
        ))}
      </div>
    </div>
  );
}

export default function MenuCategoriesPanel({ onAddProduct }: MenuCategoriesPanelProps) {
  const taxonomyQuery = useMenuTaxonomy();
  const categories = taxonomyQuery.data ?? [];

  if (taxonomyQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Kategoriler yükleniyor…</p>;
  }

  if (taxonomyQuery.isError) {
    return <p className="text-sm text-destructive">Kategori listesi alınamadı.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Kategoriler platform genelinde sabittir. Yeni ana/alt kategori eklemek için admin paneli gerekir.
        Ürün eklerken yalnızca listeden seçim yapabilirsiniz.
      </div>
      <div className="space-y-3">
        {categories.map((main) => (
          <MainBlock key={main.id} main={main} onAddProduct={onAddProduct} />
        ))}
      </div>
    </div>
  );
}
