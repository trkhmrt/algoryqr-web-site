import type { ReactNode } from "react";

import type { MenuCategoryApiItem, MenuProfileApiItem } from "@/lib/api";
import { findCategoryById, flattenNavCategories } from "../types";
import { MenuCategoryRail } from "../shared";
import { GlassyGrayCategorySidebar } from "./CategorySidebar";
import { GlassyGrayTopNav } from "./TopNav";
import { GLASSY_GRAY_HERO_IMAGE, GLASSY_GRAY_STYLES } from "./styles";

type ShellProps = {
  menu: MenuProfileApiItem;
  categories: MenuCategoryApiItem[];
  activeNav: "home" | "menu";
  activeCategoryId: number | null;
  showSearch?: boolean;
  showCategoryRail?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onHome: () => void;
  onMenu: () => void;
  onSelectCategory: (category: MenuCategoryApiItem) => void;
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
  const navCategories = flattenNavCategories(categories);
  const activeKey =
    activeCategoryId != null ? `cat-${activeCategoryId}` : null;

  return (
    <div className="glassy-gray-menu relative min-h-screen overflow-x-hidden">
      <style>{GLASSY_GRAY_STYLES}</style>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="h-full w-full scale-105 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url('${GLASSY_GRAY_HERO_IMAGE}')` }}
        />
        <div className="gg-hero-fade absolute inset-0" />
      </div>

      <GlassyGrayTopNav
        businessName={menu.businessName}
        active={activeNav}
        showSearch={showSearch}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onHome={onHome}
        onMenu={onMenu}
        onBack={onBack}
      />

      <GlassyGrayCategorySidebar
        businessName={menu.businessName}
        slogan={menu.slogan}
        phone={menu.phone}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={onSelectCategory}
        onHome={onHome}
      />

      <main
        className={`relative z-10 min-h-screen px-4 pb-10 md:px-12 lg:ml-64 ${
          showSearch ? "pt-36" : "pt-28"
        }`}
      >
        {showCategoryRail && navCategories.length > 0 ? (
          <div className="mb-6 lg:hidden">
            <MenuCategoryRail
              categories={navCategories}
              activeKey={activeKey}
              onSelect={(cat) => {
                if (cat.categoryId == null) return;
                const found = findCategoryById(categories, cat.categoryId);
                if (found) onSelectCategory(found);
              }}
              activeChipClassName="bg-[var(--gg-primary)] text-[#1a120e]"
              inactiveChipClassName="gg-glass text-white/80"
            />
          </div>
        ) : null}
        {children}
      </main>

      <div className="pointer-events-none fixed inset-0 z-40 opacity-30">
        <div className="gg-glow-a absolute left-1/4 top-1/4 h-96 w-96 rounded-full blur-3xl" />
        <div className="gg-glow-b absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
