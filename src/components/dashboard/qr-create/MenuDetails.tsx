import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuThemePreviewDialog } from "@/components/menu-templates/MenuThemePreviewDialog";
import {
  DEFAULT_MENU_THEME_ID,
  getMenuTemplateOptions,
  type MenuThemeId,
} from "@/components/menu-templates/registry";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type { MenuThemeId };

export type MenuData = {
  businessName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  themeId: MenuThemeId;
};

export const createInitialMenuData = (): MenuData => ({
  businessName: "",
  slogan: "",
  phone: "",
  email: "",
  address: "",
  themeId: DEFAULT_MENU_THEME_ID,
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

export function MenuDetails({ value, onChange }: MenuDetailsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedTheme =
    THEME_OPTIONS.find((theme) => theme.id === value.themeId) ?? THEME_OPTIONS[0];

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
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Menü Teması</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPreviewOpen(true)}
          >
            Önizle
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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

      <MenuThemePreviewDialog
        themeId={value.themeId}
        themeName={selectedTheme.label}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
