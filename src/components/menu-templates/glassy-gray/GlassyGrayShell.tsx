import type { ReactNode } from "react";

import type { MenuProfileApiItem } from "@/lib/api";
import type { TaxonomyNavNode } from "../types";
import {
  MenuCategoryRail,
  MenuViewportFrame,
  resolveNavNodeFromRailCategory,
  taxonomyNavNodesToRailCategories,
} from "../shared";
import { GlassyGrayTopNav } from "./TopNav";
import { GLASSY_GRAY_HERO_IMAGE, GLASSY_GRAY_STYLES } from "./styles";

type ShellProps = {
  menu: MenuProfileApiItem;
  categories: TaxonomyNavNode[];
  activeNav: "home" | "menu";
  activeCategoryId: number | null;
  showSearch?: boolean;
  showCategoryRail?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onHome: () => void;
  onMenu: () => void;
  onSelectCategory: (category: TaxonomyNavNode) => void;
  onBack?: () => void;
  children: ReactNode;
};

export function GlassyGrayShell({
  menu,
  categories,
  activeNav,
  activeCategoryId,
  showSearch,
  showCategoryRail = false,
  searchValue,
  onSearchChange,
  onHome,
  onMenu,
  onSelectCategory,
  onBack,
  children,
}: ShellProps) {
  const navCategories = taxonomyNavNodesToRailCategories(categories);
  const activeKey =
    activeCategoryId != null ? `cat-${activeCategoryId}` : null;

  return (
    <MenuViewportFrame frameBgClassName="glassy-gray-menu" innerClassName="glassy-gray-menu relative overflow-x-hidden">
      <style>{GLASSY_GRAY_STYLES}</style>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="h-full w-full scale-105 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url('${GLASSY_GRAY_HERO_IMAGE}')` }}
        />
        <div className="gg-hero-fade absolute inset-0" />
      </div>

      <GlassyGrayTopNav
        businessName={menu.businessName}
        logoUrl={menu.logoUrl}
        active={activeNav}
        showSearch={showSearch}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onHome={onHome}
        onMenu={onMenu}
        onBack={onBack}
      />

      <main
        className={`relative z-10 min-h-screen px-4 pb-16 ${
          showSearch ? "pt-28" : "pt-20"
        }`}
      >
        {showCategoryRail && navCategories.length > 0 ? (
          <div className="mb-4">
            <MenuCategoryRail
              categories={navCategories}
              activeKey={activeKey}
              onSelect={(cat) => {
                const found = resolveNavNodeFromRailCategory(categories, cat);
                if (found) onSelectCategory(found);
              }}
              activeChipClassName="bg-[var(--gg-primary)] text-[#1a120e]"
              inactiveChipClassName="gg-glass text-white/80"
            />
          </div>
        ) : null}
        {children}
      </main>

      <div className="pointer-events-none absolute inset-0 z-[1] opacity-30">
        <div className="gg-glow-a absolute left-1/4 top-1/4 h-48 w-48 rounded-full blur-3xl" />
        <div className="gg-glow-b absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full blur-3xl" />
      </div>
    </MenuViewportFrame>
  );
}
