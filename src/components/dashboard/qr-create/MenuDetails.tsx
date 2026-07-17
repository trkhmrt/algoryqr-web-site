import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DEFAULT_MENU_THEME_ID,
  getMenuTemplateOptions,
  type MenuThemeId,
} from "@/components/menu-templates/registry";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { checkMenuSlugAvailabilityRequest } from "@/lib/api";

export type { MenuThemeId };
export type MenuUrlMode = "id" | "slug";

export type MenuData = {
  businessName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  themeId: MenuThemeId;
  urlMode: MenuUrlMode;
  publicSlug: string;
};

export const createInitialMenuData = (): MenuData => ({
  businessName: "",
  slogan: "",
  phone: "",
  email: "",
  address: "",
  themeId: DEFAULT_MENU_THEME_ID,
  urlMode: "id",
  publicSlug: "",
});

const THEME_OPTIONS = getMenuTemplateOptions().map((theme) => ({
  id: theme.id,
  label: theme.name,
  preview: theme.previewClassName,
}));

type MenuDetailsProps = {
  value: MenuData;
  onChange: (value: MenuData) => void;
  excludeMenuId?: number;
};

export function MenuDetails({ value, onChange, excludeMenuId }: MenuDetailsProps) {
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  useEffect(() => {
    if (value.urlMode !== "slug") {
      setSlugStatus("idle");
      return;
    }
    const slug = value.publicSlug.trim();
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const result = await checkMenuSlugAvailabilityRequest(slug, excludeMenuId);
        setSlugStatus(result.available ? "available" : result.slug ? "taken" : "invalid");
      } catch {
        setSlugStatus("invalid");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value.publicSlug, value.urlMode, excludeMenuId]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Firma / İşletme Adı</Label>
        <Input
          placeholder="Kafe İstanbul"
          className="bg-background"
          value={value.businessName}
          onChange={(e) => onChange({ ...value, businessName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Slogan</Label>
        <Input
          placeholder="Lezzetin adresi"
          className="bg-background"
          value={value.slogan}
          onChange={(e) => onChange({ ...value, slogan: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Telefon</Label>
          <Input
            placeholder="+90 555 000 0000"
            className="bg-background"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">E-posta</Label>
          <Input
            placeholder="info@isletme.com"
            className="bg-background"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Adres</Label>
        <Input
          placeholder="Mahalle, cadde, il"
          className="bg-background"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Menü Teması</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange({ ...value, themeId: theme.id })}
              className={cn(
                "rounded-lg border p-3 text-left transition-all",
                value.themeId === theme.id ? "border-foreground/40 ring-1 ring-foreground/20" : "border-border hover:border-foreground/20",
              )}
            >
              <div className={cn("mb-2 h-10 rounded-md px-2 py-1 text-[10px] font-medium", theme.preview)}>
                {theme.label}
              </div>
              <span className="text-xs font-medium">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Public URL Tercihi</Label>
        <RadioGroup
          value={value.urlMode}
          onValueChange={(next) => onChange({ ...value, urlMode: next as MenuUrlMode })}
          className="grid gap-2 sm:grid-cols-2"
        >
          <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer">
            <RadioGroupItem value="id" />
            <div>
              <p className="text-sm font-medium">Sayısal ID</p>
              <p className="text-xs text-muted-foreground">/menu/42</p>
            </div>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer">
            <RadioGroupItem value="slug" />
            <div>
              <p className="text-sm font-medium">Özel adres</p>
              <p className="text-xs text-muted-foreground">/menu/kafe-istanbul</p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {value.urlMode === "slug" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Özel Adres (slug)</Label>
          <Input
            placeholder="kafe-istanbul"
            className="bg-background"
            value={value.publicSlug}
            onChange={(e) => onChange({ ...value, publicSlug: e.target.value })}
          />
          {slugStatus === "checking" && <p className="text-xs text-muted-foreground">Kontrol ediliyor...</p>}
          {slugStatus === "available" && <p className="text-xs text-green-600">Bu adres kullanılabilir.</p>}
          {slugStatus === "taken" && <p className="text-xs text-destructive">Bu adres zaten alınmış.</p>}
          {slugStatus === "invalid" && <p className="text-xs text-destructive">Geçersiz format (a-z, 0-9, tire, 3-50 karakter).</p>}
        </div>
      )}
    </div>
  );
}
