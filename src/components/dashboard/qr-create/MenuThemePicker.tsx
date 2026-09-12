"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DigitalMenuIcon } from "@/components/icons/DigitalMenuIcon";
import { MenuThemePreviewDialog } from "@/components/menu-templates/MenuThemePreviewDialog";
import { getMenuTemplate, isMenuThemeId, type MenuThemeId } from "@/components/menu-templates/registry";
import { ApiError } from "@/lib/api";
import { fetchMenuThemes, sortActiveMenuThemes } from "@/lib/menu-themes-api";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ThemeOption = { id: MenuThemeId; name: string; previewClassName: string; swatch?: string };

type Props = {
  themeId: MenuThemeId;
  onThemeIdChange: (themeId: MenuThemeId) => void;
  autoSelectFirstAllowed?: boolean;
};

export function MenuThemePicker({ themeId, onThemeIdChange, autoSelectFirstAllowed = false }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [options, setOptions] = useState<ThemeOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const themes = sortActiveMenuThemes(await fetchMenuThemes());
        if (cancelled) return;
        const next: ThemeOption[] = [];
        for (const theme of themes) {
          const code = theme.code?.trim() ?? "";
          if (!isMenuThemeId(code)) continue; // skip soft/classic etc. not in MENU_TEMPLATES
          const template = getMenuTemplate(code);
          next.push({
            id: code,
            name: theme.name?.trim() || template.name,
            previewClassName: template.previewClassName,
            swatch: typeof theme.previewMeta?.swatch === "string" ? theme.previewMeta.swatch : undefined,
          });
        }
        setOptions(next);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setOptions([]);
        setError(err instanceof ApiError ? err.message : "Menü temaları yüklenemedi.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!autoSelectFirstAllowed || !options?.length) return;
    if (options.some((o) => o.id === themeId)) return;
    onThemeIdChange(options[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create-flow hydrate only
  }, [autoSelectFirstAllowed, options]);

  const themeName = useMemo(() => {
    const fromApi = options?.find((o) => o.id === themeId)?.name;
    if (fromApi) return fromApi;
    return isMenuThemeId(themeId) ? getMenuTemplate(themeId).name : themeId;
  }, [options, themeId]);

  const canPreview = isMenuThemeId(themeId);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Menü Teması</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={!canPreview || options == null || options.length === 0}
            onClick={() => setPreviewOpen(true)}
          >
            Önizle
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {options == null ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Temalar yükleniyor...
          </div>
        ) : options.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">Henüz atanmış tema yok</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hesabınıza menü teması atanana kadar görünüm seçenekleri burada listelenmez. Lütfen
              destek ekibiyle iletişime geçin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {options.map((option) => {
              const selected = themeId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onThemeIdChange(option.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-2.5 text-left transition",
                    selected ? "border-foreground ring-2 ring-foreground/20" : "border-border hover:border-foreground/30",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md",
                      option.previewClassName,
                    )}
                    style={option.swatch ? { backgroundColor: option.swatch } : undefined}
                    aria-hidden
                  >
                    <DigitalMenuIcon className="h-7 w-7 opacity-90" />
                  </div>
                  <span className="text-xs font-medium leading-tight">{option.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {canPreview ? (
        <MenuThemePreviewDialog
          themeId={themeId}
          themeName={themeName}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      ) : null}
    </>
  );
}
