"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MainCategoryApiItem, SubCategoryApiItem } from "@/lib/api";
import { useMenuTaxonomyPage } from "@/hooks/use-menu-categories";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;
const SEARCH_DEBOUNCE_MS = 300;

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
    <div className="ml-1 flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 sm:ml-4">
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
  expanded,
  onToggle,
  onAddProduct,
}: {
  main: MainCategoryApiItem;
  expanded: boolean;
  onToggle: () => void;
  onAddProduct?: (subCategoryId: number) => void;
}) {
  const subCount = main.subs?.length ?? 0;
  return (
    <div className="rounded-xl border border-border/80">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/40"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{main.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {main.slug}
            {subCount > 0 ? ` · ${subCount} alt kategori` : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded ? "rotate-180" : "rotate-0",
          )}
        />
      </button>
      {expanded ? (
        <div className="space-y-2 border-t border-border/60 px-3 py-3">
          {subCount === 0 ? (
            <p className="text-xs text-muted-foreground">Alt kategori yok.</p>
          ) : (
            (main.subs ?? []).map((sub) => (
              <SubRow key={sub.id} sub={sub} onAddProduct={onAddProduct} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function MenuCategoriesPanel({ onAddProduct }: MenuCategoriesPanelProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const taxonomyQuery = useMenuTaxonomyPage({
    page,
    size: PAGE_SIZE,
    q: debouncedSearch || undefined,
  });
  const categories = taxonomyQuery.data?.content ?? [];
  const totalElements = taxonomyQuery.data?.totalElements ?? 0;
  const totalPages = taxonomyQuery.data?.totalPages ?? 0;
  const hasNext = taxonomyQuery.data?.hasNext ?? page + 1 < totalPages;
  const expandAllFromSearch = Boolean(debouncedSearch);

  useEffect(() => {
    if (!taxonomyQuery.isFetching && categories.length === 0 && page > 0) {
      setPage((current) => Math.max(0, current - 1));
    }
  }, [categories.length, page, taxonomyQuery.isFetching]);

  const toggleMain = (id: number) => {
    if (expandAllFromSearch) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Kategoriler platform genelinde sabittir. Yeni ana/alt kategori eklemek için admin paneli gerekir.
        Ürün eklerken yalnızca listeden seçim yapabilirsiniz.
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Kategori ara…"
          className="pl-9"
        />
      </div>

      {taxonomyQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Kategoriler yükleniyor…</p>
      ) : taxonomyQuery.isError ? (
        <p className="text-sm text-destructive">Kategori listesi alınamadı.</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {debouncedSearch ? "Aramayla eşleşen kategori bulunamadı." : "Kategori bulunamadı."}
        </p>
      ) : (
        <div className="space-y-3">
          {categories.map((main) => (
            <MainBlock
              key={main.id}
              main={main}
              expanded={expandAllFromSearch || expandedIds.has(main.id)}
              onToggle={() => toggleMain(main.id)}
              onAddProduct={onAddProduct}
            />
          ))}
        </div>
      )}

      {!taxonomyQuery.isLoading && !taxonomyQuery.isError && totalElements > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Sayfa {page + 1} / {Math.max(1, totalPages)} · {totalElements} ana kategori
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 0 || taxonomyQuery.isFetching}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Önceki
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={!hasNext || taxonomyQuery.isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              Sonraki
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
