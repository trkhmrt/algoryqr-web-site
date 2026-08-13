"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuThemePreviewDialog } from "@/components/menu-templates/MenuThemePreviewDialog";
import { DEFAULT_MENU_THEME_ID, getMenuTemplate, getMenuTemplateOptions, type MenuThemeId } from "@/components/menu-templates/registry";
import { DEFAULT_CHEF_DISPLAY_NAME } from "@/lib/chef/chef-identity";
import { ApiError, getChefAvatarsRequest, type ChefAvatarApiItem } from "@/lib/api";
import { MenuLogoField } from "@/components/dashboard/menu/MenuLogoField";
import { MenuQrPreview, type MenuQrPreviewProps } from "@/components/dashboard/menu/MenuQrPreview";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type { MenuThemeId };

export type MenuData = {
  businessName: string;
  slogan: string;
  phone: string;
  email: string;
  address: string;
  themeId: MenuThemeId;
  chefName: string;
  chefAvatarKey: string;
  logoUrl: string;
};

export const createInitialMenuData = (): MenuData => ({
  businessName: "",
  slogan: "",
  phone: "",
  email: "",
  address: "",
  themeId: DEFAULT_MENU_THEME_ID,
  chefName: "",
  chefAvatarKey: "default",
  logoUrl: "",
});

export type MenuDetailsSection = "all" | "info" | "appearance";

type MenuDetailsProps = {
  value: MenuData;
  onChange: (value: MenuData) => void;
  excludeMenuId?: number;
  menuId?: number | null;
  section?: MenuDetailsSection;
  qrPreview?: MenuQrPreviewProps | null;
};

export function MenuDetails({ value, onChange, menuId, section = "all", qrPreview }: MenuDetailsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [avatars, setAvatars] = useState<ChefAvatarApiItem[]>([]);
  const [avatarsError, setAvatarsError] = useState<string | null>(null);
  const showInfo = section === "all" || section === "info";
  const showAppearance = section === "all" || section === "appearance";

  useEffect(() => {
    if (!showInfo) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await getChefAvatarsRequest();
        if (cancelled) return;
        setAvatars(items);
        setAvatarsError(null);
      } catch (error) {
        if (cancelled) return;
        setAvatarsError(
          error instanceof ApiError ? error.message : "Şef avatarları yüklenemedi.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showInfo]);

  return (
    <div className="space-y-4">
      {showInfo ? (
        <>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Firma / İşletme Adı</Label>
              <Input
                placeholder="Kafe İstanbul"
                className="bg-background"
                value={value.businessName}
                onChange={(e) => onChange({ ...value, businessName: e.target.value })}
              />
            </div>
            {qrPreview ? <MenuQrPreview {...qrPreview} /> : null}
          </div>
          {menuId != null && menuId > 0 ? (
            <MenuLogoField
              menuId={menuId}
              value={value.logoUrl}
              onChange={(logoUrl) => onChange({ ...value, logoUrl: logoUrl ?? "" })}
            />
          ) : null}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Slogan</Label>
            <Input
              placeholder="Lezzetin adresi"
              className="bg-background"
              value={value.slogan}
              onChange={(e) => onChange({ ...value, slogan: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Şef adı</Label>
            <Input
              placeholder={DEFAULT_CHEF_DISPLAY_NAME}
              className="bg-background"
              value={value.chefName}
              onChange={(e) => onChange({ ...value, chefName: e.target.value })}
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">
              Boş bırakılırsa: {DEFAULT_CHEF_DISPLAY_NAME}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Şef avatarı</Label>
            {avatarsError ? (
              <p className="text-xs text-destructive">{avatarsError}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {avatars.map((avatar) => {
                const selected = value.chefAvatarKey === avatar.key;
                return (
                  <button
                    key={avatar.key}
                    type="button"
                    title={avatar.label}
                    onClick={() => onChange({ ...value, chefAvatarKey: avatar.key })}
                    className={cn(
                      "relative h-16 w-16 overflow-hidden rounded-full border transition",
                      selected
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border hover:border-foreground/30",
                    )}
                  >
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.label}
                      className="h-full w-full object-cover object-top"
                    />
                  </button>
                );
              })}
            </div>
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
        </>
      ) : null}

      {showAppearance ? (
        <>
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {getMenuTemplateOptions().map((option) => {
                const selected = value.themeId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChange({ ...value, themeId: option.id as MenuThemeId })}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-2.5 text-left transition",
                      selected
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border hover:border-foreground/30",
                    )}
                  >
                    <div
                      className={cn(
                        "relative h-12 w-16 shrink-0 overflow-hidden rounded-md",
                        option.previewClassName,
                      )}
                      aria-hidden
                    >
                      <span className="absolute bottom-1.5 left-1.5 h-1.5 w-6 rounded-full bg-current opacity-80" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <MenuThemePreviewDialog
            themeId={value.themeId}
            themeName={getMenuTemplate(value.themeId).name}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
          />
        </>
      ) : null}
    </div>
  );
}
