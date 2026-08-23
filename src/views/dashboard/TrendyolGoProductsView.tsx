"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { useBranches } from "@/hooks/use-branches";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { listTrendyolGoProducts } from "@/lib/trendyol-go-api";

export default function TrendyolGoProductsView() {
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchesQuery = useBranches(canUseDigitalMenu && !accessLoading);
  const branches = branchesQuery.data?.content ?? [];
  const [branchId, setBranchId] = useState<number | null>(null);
  const selectedBranchId = branchId ?? branches[0]?.id ?? null;
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const productsQuery = useQuery({
    queryKey: ["tgo-products", selectedBranchId, q, page],
    queryFn: () => listTrendyolGoProducts(selectedBranchId as number, q, page),
    enabled: selectedBranchId != null && canUseDigitalMenu,
  });

  const pageData = productsQuery.data;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TGO Ürünler</h1>
          <p className="text-sm text-muted-foreground">Partner menüsündeki mevcut ürünler</p>
        </div>
        <Button asChild variant="outline">
          <Link href={DASHBOARD_ROUTES.trendyolGo}>Bağlantı</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xs"
          value={selectedBranchId ?? ""}
          onChange={(event) => {
            setBranchId(Number(event.target.value));
            setPage(0);
          }}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <Input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(0);
          }}
          placeholder="Ürün ara"
        />
      </div>

      {productsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : productsQuery.isError ? (
        <p className="text-sm text-destructive">Ürünler alınamadı. Önce restoran bağlayın.</p>
      ) : (
        <div className="space-y-3">
          {(pageData?.content ?? []).map((product) => (
            <Card key={product.id}>
              <CardContent className="flex gap-3 py-4">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.categoryName || "Kategori yok"} · {product.available ? "Satışta" : "Kapalı"}
                  </p>
                  {product.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                  ) : null}
                </div>
                <p className="text-sm font-semibold whitespace-nowrap">
                  {product.price != null ? `${product.price} ${product.currency || "TRY"}` : "—"}
                </p>
              </CardContent>
            </Card>
          ))}
          {(pageData?.content ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Ürün bulunamadı.</p>
          ) : null}
          {(pageData?.totalPages ?? 0) > 1 ? (
            <div className="flex justify-between">
              <Button variant="outline" disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
                Önceki
              </Button>
              <Button
                variant="outline"
                disabled={page + 1 >= (pageData?.totalPages ?? 0)}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sonraki
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
