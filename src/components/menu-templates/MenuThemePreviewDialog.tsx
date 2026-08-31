"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMenuTemplate } from "./registry";
import {
  MENU_THEME_PREVIEW_CATEGORIES,
  MENU_THEME_PREVIEW_MENU,
  MENU_THEME_PREVIEW_PRODUCTS,
} from "./preview-data";
import { MenuCurrencyProvider, MenuProductFeed, PublicMenuThemeProvider } from "./shared";

type MenuThemePreviewDialogProps = {
  themeId: string;
  themeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MenuThemePreviewDialog({
  themeId,
  themeName,
  open,
  onOpenChange,
}: MenuThemePreviewDialogProps) {
  const { Component } = getMenuTemplate(themeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(100vw-2rem,448px)] max-w-md flex-col gap-3 overflow-hidden p-4 sm:rounded-xl">
        <DialogHeader>
          <DialogTitle>{themeName} önizleme</DialogTitle>
          <DialogDescription>
            Örnek menü verisiyle temayı gezinin. Gerçek menünüz farklı olabilir.
          </DialogDescription>
        </DialogHeader>
        <div className="relative isolate h-[min(70vh,720px)] overflow-y-auto overscroll-contain rounded-[1.75rem] border border-border shadow-inner [transform:translateZ(0)]">
          {open ? (
            <MenuProductFeed
              key={themeId}
              menuId={MENU_THEME_PREVIEW_MENU.menuId}
              initialProducts={MENU_THEME_PREVIEW_PRODUCTS}
              productHasNext={false}
            >
              <PublicMenuThemeProvider themeId={themeId}>
                <MenuCurrencyProvider>
                  <Component
                    menu={{ ...MENU_THEME_PREVIEW_MENU, themeId }}
                    products={MENU_THEME_PREVIEW_PRODUCTS}
                    categories={MENU_THEME_PREVIEW_CATEGORIES}
                  />
                </MenuCurrencyProvider>
              </PublicMenuThemeProvider>
            </MenuProductFeed>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
