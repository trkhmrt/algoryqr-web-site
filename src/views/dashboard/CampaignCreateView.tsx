"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  DigitalMenuPicker,
  useDigitalMenuAccess,
  useDigitalMenuSelection,
} from "@/components/dashboard/menu/DigitalMenuPicker";
import { CampaignImageField } from "@/components/dashboard/menu/CampaignImageField";
import { DashboardLoadingState } from "@/components/dashboard/DashboardLoadingState";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { SearchableMultiSelect } from "@/components/dashboard/menu/SearchableMultiSelect";
import { SearchableSelect } from "@/components/dashboard/menu/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useMenuProducts } from "@/hooks/use-menu-products";
import {
  activateCampaign,
  createCampaign,
  listCampaignTemplates,
  type CampaignTemplate,
} from "@/lib/campaign-api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_PANEL_LG, DASHBOARD_SURFACE, DASHBOARD_TYPE_SECTION } from "@/lib/dashboard-surface";
import { formatMenuPrice } from "@/components/menu-templates/types";

function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CampaignCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useDashboardBanners();
  const qrFromQuery = Number(searchParams.get("qr"));
  const initialQrId = Number.isFinite(qrFromQuery) && qrFromQuery > 0 ? qrFromQuery : null;

  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const { menuQrs, selection, loading, selectQrId } = useDigitalMenuSelection(
    initialQrId,
    canUseDigitalMenu && !accessLoading,
  );
  const menuId = selection?.menu.menuId ?? null;

  const templatesQuery = useQuery({
    queryKey: ["campaign-templates"],
    queryFn: listCampaignTemplates,
  });

  const [step, setStep] = useState(1);
  const [templateCode, setTemplateCode] = useState<string>("");
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [startsAt, setStartsAt] = useState(toLocalDateTimeValue(new Date()));
  const [endsAt, setEndsAt] = useState(
    toLocalDateTimeValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  );
  const [targetProductIds, setTargetProductIds] = useState<string[]>([]);
  const [requiredQuantity, setRequiredQuantity] = useState("5");
  const [rewardProductId, setRewardProductId] = useState("");
  const [thresholdAmount, setThresholdAmount] = useState("500");
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const templates = templatesQuery.data;
    if (!templates?.length) return;
    if (!templates.some((item) => item.code === templateCode)) {
      setTemplateCode(templates[0].code);
    }
  }, [templatesQuery.data, templateCode]);

  const selectedTemplate = useMemo(
    () => templatesQuery.data?.find((item) => item.code === templateCode),
    [templatesQuery.data, templateCode],
  );

  const productsQuery = useMenuProducts(menuId, step === 3);

  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((product) => ({
        value: String(product.productId),
        label: `${product.name}${product.price != null ? ` · ${formatMenuPrice(product.price, product.currency)}` : ""}`,
      })),
    [productsQuery.data],
  );

  const imageProductIds = useMemo(() => {
    if (templateCode === "STAMP_CARD") {
      return targetProductIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);
    }
    const rewardId = Number(rewardProductId);
    return Number.isFinite(rewardId) && rewardId > 0 ? [rewardId] : [];
  }, [rewardProductId, targetProductIds, templateCode]);

  const imageProducts = useMemo(() => {
    const byId = new Map(
      (productsQuery.data ?? []).map((product) => [product.productId, product]),
    );
    return imageProductIds
      .map((productId) => byId.get(productId))
      .filter((product): product is NonNullable<typeof product> => product != null)
      .map((product) => ({
        name: product.name,
        imageUrl: product.imageUrl,
      }));
  }, [imageProductIds, productsQuery.data]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (menuId == null) throw new Error("Menü seçilmedi");
      if (!templateCode) throw new Error("Kampanya şablonu seçilmedi");
      const productIds = targetProductIds
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);
      const rewardId = Number(rewardProductId);
      const config =
        templateCode === "SPEND_THRESHOLD"
          ? {
              thresholdAmount: Number(thresholdAmount),
              period,
              scope: { type: "ALL" },
              reward: {
                type: "FREE_PRODUCT",
                productId: Number.isFinite(rewardId) ? rewardId : productIds[0],
                quantity: 1,
              },
              qualificationMoment: "ORDER_CONFIRMED",
            }
          : {
              targetProductIds: productIds,
              requiredQuantity: Number(requiredQuantity),
              reward: {
                type: "FREE_PRODUCT",
                productId: Number.isFinite(rewardId) ? rewardId : productIds[0],
                quantity: 1,
              },
              resetAfterReward: true,
              qualificationMoment: "ORDER_CONFIRMED",
            };

      const created = await createCampaign(menuId, {
        templateCode,
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        imageUrl: imageUrl || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        config,
      });
      await activateCampaign(menuId, created.id);
      return created;
    },
    onSuccess: () => {
      notify("info", "Kampanya oluşturuldu ve yayınlandı.");
      router.push(
        selection?.qr.id
          ? DASHBOARD_ROUTES.campaignsForQr(selection.qr.id)
          : DASHBOARD_ROUTES.campaigns,
      );
    },
    onError: (err) => {
      notify("danger", err instanceof Error ? err.message : "Kampanya oluşturulamadı.");
    },
  });

  if (accessLoading || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <DashboardPageHeader title="Kampanya Oluştur" hint="Adım bilgisi yükleniyor." />
        <DashboardLoadingState label="Kampanya oluşturma ekranı hazırlanıyor..." />
      </div>
    );
  }

  const templates = templatesQuery.data ?? [];
  const canAdvanceFromStep1 =
    Boolean(templateCode) && templates.some((item) => item.code === templateCode);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <DashboardPageHeader
        title="Kampanya Oluştur"
        hint={`Adım ${step}/3`}
        back={
          <Link
            href={
              selection?.qr.id
                ? DASHBOARD_ROUTES.campaignsForQr(selection.qr.id)
                : DASHBOARD_ROUTES.campaigns
            }
            aria-label="Kampanyalara dön"
            className={DASHBOARD_BACK}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className={DASHBOARD_SURFACE}>
        <div className="p-4 sm:p-5">
          <DigitalMenuPicker
            menuQrs={menuQrs}
            selectedQrId={selection?.qr.id ?? null}
            onSelectQrId={(qrId) => {
              void selectQrId(qrId);
            }}
          />
        </div>
      </div>

      {step === 1 ? (
        <div className={DASHBOARD_PANEL_LG}>
          <h2 className={DASHBOARD_TYPE_SECTION}>Şablon seçin</h2>
          {templatesQuery.isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Şablonlar yükleniyor…
            </div>
          ) : templatesQuery.isError ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-destructive">
                Kampanya şablonları yüklenemedi.
                {templatesQuery.error instanceof Error
                  ? ` ${templatesQuery.error.message}`
                  : ""}
              </p>
              <Button variant="outline" size="sm" onClick={() => void templatesQuery.refetch()}>
                Tekrar dene
              </Button>
            </div>
          ) : templates.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Henüz tanımlı kampanya şablonu yok. Backend tarafında `tbl_campaign_template`
              seed edilmeli.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {templates.map((template: CampaignTemplate) => (
                <button
                  key={template.code}
                  type="button"
                  onClick={() => setTemplateCode(template.code)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    templateCode === template.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className={`${DASHBOARD_PANEL_LG} space-y-4`}>
          <h2 className={DASHBOARD_TYPE_SECTION}>Temel bilgiler</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-name">Kampanya adı</Label>
              <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-slogan">Slogan</Label>
              <Input
                id="campaign-slogan"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="5 kahve al, 1 bedava"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="starts-at">Başlangıç</Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ends-at">Bitiş</Label>
                <Input
                  id="ends-at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className={`${DASHBOARD_PANEL_LG} space-y-4`}>
          <h2 className={DASHBOARD_TYPE_SECTION}>{selectedTemplate?.name ?? "Kampanya ayarları"}</h2>
          <div className="space-y-4">
            {templateCode === "STAMP_CARD" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Hedef ürünler</Label>
                  {productsQuery.isLoading ? (
                    <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ürünler yükleniyor…
                    </div>
                  ) : productsQuery.isError ? (
                    <p className="text-sm text-destructive">Menü ürünleri yüklenemedi.</p>
                  ) : (
                    <SearchableMultiSelect
                      values={targetProductIds}
                      onValuesChange={setTargetProductIds}
                      options={productOptions}
                      placeholder="Kampanyaya dahil ürünleri seçin"
                      searchPlaceholder="Ürün ara..."
                      emptyText="Bu menüde ürün bulunamadı."
                      disabled={menuId == null}
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="required-quantity">Gerekli adet</Label>
                  <Input
                    id="required-quantity"
                    type="number"
                    min={1}
                    value={requiredQuantity}
                    onChange={(e) => setRequiredQuantity(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="threshold-amount">Eşik tutar (TL)</Label>
                  <Input
                    id="threshold-amount"
                    type="number"
                    min={1}
                    value={thresholdAmount}
                    onChange={(e) => setThresholdAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="period">Periyot</Label>
                  <select
                    id="period"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as "WEEKLY" | "MONTHLY")}
                  >
                    <option value="WEEKLY">Haftalık</option>
                    <option value="MONTHLY">Aylık</option>
                  </select>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Ödül ürünü</Label>
              {productsQuery.isLoading ? (
                <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ürünler yükleniyor…
                </div>
              ) : (
                <SearchableSelect
                  value={rewardProductId}
                  onValueChange={setRewardProductId}
                  options={productOptions}
                  placeholder="Ödül olarak verilecek ürünü seçin"
                  searchPlaceholder="Ürün ara..."
                  emptyText="Bu menüde ürün bulunamadı."
                  disabled={menuId == null || productsQuery.isError}
                />
              )}
            </div>
            <CampaignImageField
              menuId={menuId}
              value={imageUrl}
              onChange={setImageUrl}
              campaignName={name}
              campaignSlogan={slogan}
              products={imageProducts}
            />
          </div>
        </div>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep((prev) => prev - 1)}>
          Geri
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep((prev) => prev + 1)}
            disabled={
              (step === 1 && !canAdvanceFromStep1) ||
              (step === 2 && !name.trim()) ||
              menuId == null
            }
          >
            İleri
          </Button>
        ) : (
          <Button
            disabled={
              createMutation.isPending ||
              menuId == null ||
              !templateCode ||
              (templateCode === "STAMP_CARD" && targetProductIds.length === 0)
            }
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yayınla"}
          </Button>
        )}
      </div>
    </div>
  );
}
