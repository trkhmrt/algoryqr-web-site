"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { ApiError } from "@/lib/api";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { DASHBOARD_BACK, DASHBOARD_SURFACE } from "@/lib/dashboard-surface";
import {
  createPrinterPairingCode,
  createTestPrintJob,
  getPrinterDashboard,
  updatePrinterSettings,
} from "@/lib/printer-api";
import type { MarketplacePrintSource, PrinterConnectionType, PrintTrigger } from "@/lib/printer-types";
import { printReceiptInBrowser, testReceiptPayload } from "@/lib/receipt-ticket";
import { UBER_EATS_SOFT_FIELD_CLASS } from "@/lib/ubereats-ui";

const CONNECTION_OPTIONS: Array<{ value: PrinterConnectionType; label: string; hint: string }> = [
  { value: "LAN", label: "LAN / Ethernet", hint: "Yazıcı IP’si, port 9100" },
  { value: "USB", label: "USB", hint: "Ajan PC’sine USB kablo" },
  { value: "OS_DRIVER", label: "Sistem yazıcısı", hint: "Windows/macOS sürücüsü" },
];

export default function PrinterHubView() {
  const { notify } = useDashboardBanners();
  const queryClient = useQueryClient();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const [lanHost, setLanHost] = useState<string | null>(null);
  const [lanPort, setLanPort] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["printer-dashboard"],
    queryFn: getPrinterDashboard,
    enabled: canUseDigitalMenu && !accessLoading,
    refetchInterval: 8_000,
  });

  const settings = dashboardQuery.data?.settings;
  const station = dashboardQuery.data?.station;
  const pairing = dashboardQuery.data?.pairingCode;

  const saveMutation = useMutation({
    mutationFn: updatePrinterSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["printer-dashboard"] });
      notify("info", "Yazıcı ayarları kaydedildi.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Ayarlar kaydedilemedi.");
    },
  });

  const pairMutation = useMutation({
    mutationFn: createPrinterPairingCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["printer-dashboard"] });
      notify("info", "Eşleme kodu oluşturuldu. Ajan kurulumunda bu kodu girin.");
    },
    onError: (error) => {
      notify("danger", error instanceof ApiError ? error.message : "Kod oluşturulamadı.");
    },
  });

  const testMutation = useMutation({
    mutationFn: createTestPrintJob,
    onSuccess: () => {
      notify("info", "Test fişi kuyruğa alındı.");
    },
    onError: (error) => {
      printReceiptInBrowser(testReceiptPayload());
      notify(
        "info",
        error instanceof ApiError ? `${error.message} Tarayıcı yazdırma açıldı.` : "Tarayıcı yazdırma açıldı.",
      );
    },
  });

  function persist(patch: Parameters<typeof updatePrinterSettings>[0]) {
    if (!settings) return;
    saveMutation.mutate({
      ...settings,
      lanHost: lanHost ?? settings.lanHost,
      lanPort: lanPort != null ? Number(lanPort) || settings.lanPort : settings.lanPort,
      ...patch,
    });
  }

  function toggleSource(source: MarketplacePrintSource, checked: boolean) {
    if (!settings) return;
    const sources = checked
      ? Array.from(new Set([...settings.sources, source]))
      : settings.sources.filter((item) => item !== source);
    persist({ sources });
  }

  if (accessLoading || dashboardQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Yazıcı ayarları yükleniyor...
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Bu özellik dijital menü paketi gerektirir.</p>;
  }

  if (!settings || !station) {
    return <p className="text-sm text-muted-foreground">Yazıcı ayarları alınamadı.</p>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageHeader
        title="Fiş yazıcısı"
        hint="Birch CV2-UN ve benzeri ESC/POS yazıcılar. Otomatik basım için restorandaki PC’ye ajan kurulur."
        back={
          <Link href={DASHBOARD_ROUTES.integrations} className={DASHBOARD_BACK} aria-label="Entegrasyonlara dön">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
        action={
          <Button
            type="button"
            variant="outline"
            disabled={testMutation.isPending}
            onClick={() => testMutation.mutate()}
          >
            Test fişi
          </Button>
        }
      />

      <section className={`${DASHBOARD_SURFACE} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Ajan durumu</h2>
            <p className="text-xs text-muted-foreground">
              {station.paired
                ? station.online
                  ? "Bağlı ve çevrimiçi"
                  : "Eşli, şu an çevrimdışı"
                : "Henüz eşlenmedi"}
            </p>
            {station.lastError ? (
              <p className="mt-1 text-xs text-destructive">{station.lastError}</p>
            ) : null}
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              station.online ? "bg-emerald-500/15 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            {station.online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Button type="button" disabled={pairMutation.isPending} onClick={() => pairMutation.mutate()}>
            Eşleme kodu üret
          </Button>
          {pairing ? (
            <div className={UBER_EATS_SOFT_FIELD_CLASS}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Kod</p>
              <p className="font-mono text-lg font-semibold tracking-[0.3em]">{pairing.code}</p>
              <p className="text-xs text-muted-foreground">15 dakika geçerli</p>
            </div>
          ) : null}
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Yazıcıyı USB ile kasa PC’sine veya ethernet ile aynı ağa bağlayın.</li>
          <li>
            PC’de <code className="text-foreground">print-agent</code> klasörünü çalıştırın:{" "}
            <code className="text-foreground">npm start -- --api https://siteniz --code KOD</code>
          </li>
          <li>Ajan Windows açılışında çalışırsa ekran kapalıyken de basar.</li>
        </ol>
      </section>

      <section className={`${DASHBOARD_SURFACE} space-y-5 p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold">Bağlantı</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {CONNECTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => persist({ connectionType: option.value })}
              className={`rounded-xl border px-3 py-3 text-left ${
                settings.connectionType === option.value
                  ? "border-foreground bg-muted/40"
                  : "border-border"
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
            </button>
          ))}
        </div>
        {settings.connectionType === "LAN" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lan-host">Yazıcı IP</Label>
              <Input
                id="lan-host"
                value={lanHost ?? settings.lanHost}
                onChange={(event) => setLanHost(event.target.value)}
                onBlur={() => persist({ lanHost: lanHost ?? settings.lanHost })}
                placeholder="192.168.1.50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lan-port">Port</Label>
              <Input
                id="lan-port"
                value={lanPort ?? String(settings.lanPort)}
                onChange={(event) => setLanPort(event.target.value)}
                onBlur={() => persist({ lanPort: Number(lanPort) || 9100 })}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className={`${DASHBOARD_SURFACE} space-y-5 p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Otomatik basım</h2>
            <p className="text-xs text-muted-foreground">Yeni siparişte kuyruğa alınır; ajan basar.</p>
          </div>
          <Switch checked={settings.autoPrint} onCheckedChange={(checked) => persist({ autoPrint: checked })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            { value: "CREATED" as PrintTrigger, label: "Yeni sipariş (Created)" },
            { value: "ACCEPTED" as PrintTrigger, label: "Kabul edilince (Accepted)" },
          ]).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => persist({ autoPrintOn: option.value })}
              className={`rounded-xl border px-3 py-3 text-left text-sm ${
                settings.autoPrintOn === option.value ? "border-foreground bg-muted/40" : "border-border"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Kaynaklar</p>
          {(
            [
              ["YEMEK_SEPETI", "Yemek Sepeti"],
              ["UBER_EATS", "Uber Eats"],
              ["QR", "QR / masa siparişi (manuel Fiş bas)"],
            ] as Array<[MarketplacePrintSource, string]>
          ).map(([source, label]) => (
            <label key={source} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={settings.sources.includes(source)}
                onCheckedChange={(value) => toggleSource(source, value === true)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="copies">Kopya sayısı</Label>
          <Input
            id="copies"
            type="number"
            min={1}
            max={5}
            value={settings.copies}
            onChange={(event) => persist({ copies: Number(event.target.value) || 1 })}
            className="max-w-[8rem]"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={settings.cut} onCheckedChange={(value) => persist({ cut: value === true })} />
          Otomatik kes
        </label>
      </section>
    </div>
  );
}
