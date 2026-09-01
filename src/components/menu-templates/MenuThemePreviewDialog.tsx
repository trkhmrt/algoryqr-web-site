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
import {
  MenuCurrencyProvider,
  PublicMenuDataProvider,
  PublicMenuThemeProvider,
  useMenuCategoryFeed,
  useMenuProductFeed,
} from "./shared";

type MenuThemePreviewDialogProps = {
  themeId: string;
  themeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function MenuThemePreviewBody({ themeId }: { themeId: string }) {
  const { Component } = getMenuTemplate(themeId);
  const { products } = useMenuProductFeed();
  const { categories } = useMenuCategoryFeed();

  return (
    <Component
      menu={{ ...MENU_THEME_PREVIEW_MENU, themeId }}
      products={products}
      categories={categories}
    />
  );
}

export function MenuThemePreviewDialog({
  themeId,
  themeName,
  open,
  onOpenChange,
}: MenuThemePreviewDialogProps) {
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
            <PublicMenuDataProvider
              key={themeId}
              menuId={MENU_THEME_PREVIEW_MENU.menuId}
              initialCategories={MENU_THEME_PREVIEW_CATEGORIES}
              initialProducts={MENU_THEME_PREVIEW_PRODUCTS}
            >
              <PublicMenuThemeProvider themeId={themeId}>
                <MenuCurrencyProvider>
                  <MenuThemePreviewBody themeId={themeId} />
                </MenuCurrencyProvider>
              </PublicMenuThemeProvider>
            </PublicMenuDataProvider>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
