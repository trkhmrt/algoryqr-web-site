"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMenuCategoryRequest,
  deleteMenuCategoryRequest,
  getMenuCategoriesRequest,
  MenuCategoryApiItem,
  updateMenuCategoryRequest,
} from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";

type MenuCategoriesPanelProps = {
  menuId: number;
  onAddProduct?: (categoryId: number) => void;
};

type CategoryFormState = {
  name: string;
  parentId: number | null;
  editingId: number | null;
};

const emptyForm = (parentId: number | null = null): CategoryFormState => ({
  name: "",
  parentId,
  editingId: null,
});

function CategoryNode({
  category,
  depth,
  onAddChild,
  onEdit,
  onDelete,
  onAddProduct,
}: {
  category: MenuCategoryApiItem;
  depth: number;
  onAddChild: (parentId: number) => void;
  onEdit: (category: MenuCategoryApiItem) => void;
  onDelete: (categoryId: number) => void;
  onAddProduct?: (categoryId: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {depth > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="truncate text-sm font-medium">{category.name}</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onAddChild(category.categoryId)}>
            <FolderPlus className="mr-1 h-3.5 w-3.5" />
            Alt
          </Button>
          {onAddProduct ? (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onAddProduct(category.categoryId)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {"\u00dcr\u00fcn"}
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(category)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => void onDelete(category.categoryId)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {(category.children ?? []).map((child) => (
        <CategoryNode
          key={child.categoryId}
          category={child}
          depth={depth + 1}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddProduct={onAddProduct}
        />
      ))}
    </div>
  );
}

export default function MenuCategoriesPanel({ menuId, onAddProduct }: MenuCategoriesPanelProps) {
  const { notify } = useDashboardBanners();
  const [categories, setCategories] = useState<MenuCategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryFormState | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMenuCategoriesRequest(menuId);
      setCategories(data);
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Kategoriler y\u00fcklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [menuId, notify]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const resetForm = () => setForm(null);

  const handleSubmit = async () => {
    if (!form || !form.name.trim()) {
      notify("warning", "Kategori ad\u0131 zorunlu.");
      return;
    }

    try {
      if (form.editingId != null) {
        const current = findCategory(categories, form.editingId);
        await updateMenuCategoryRequest(form.editingId, {
          name: form.name.trim(),
          parentId: current?.parentId ?? null,
          sortOrder: current?.sortOrder,
        });
        notify("info", "Kategori g\u00fcncellendi.");
      } else {
        await createMenuCategoryRequest(menuId, {
          name: form.name.trim(),
          parentId: form.parentId,
        });
        notify("info", "Kategori eklendi.");
      }
      resetForm();
      await loadCategories();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Kategori kaydedilemedi.");
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteMenuCategoryRequest(categoryId);
      notify("info", "Kategori silindi.");
      await loadCategories();
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Kategori silinemedi.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Ana ve alt kategorileri y\u00f6netin.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setForm(emptyForm(null))}>
          <Plus className="h-3.5 w-3.5" />
          Ana Kategori
        </Button>
      </div>

      {form && (
        <div className="rounded-lg border border-border/70 bg-background p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {form.editingId != null
                ? "Kategori Ad\u0131"
                : form.parentId != null
                  ? "Alt Kategori Ad\u0131"
                  : "Ana Kategori Ad\u0131"}
            </Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSubmit()}>
              {form.editingId != null ? "G\u00fcncelle" : "Kaydet"}
            </Button>
            <Button size="sm" variant="outline" onClick={resetForm}>
              {"\u0130ptal"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Y\u00fckleniyor...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hen\u00fcz kategori eklenmedi.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryNode
              key={category.categoryId}
              category={category}
              depth={0}
              onAddChild={(parentId) => setForm(emptyForm(parentId))}
              onEdit={(item) =>
                setForm({
                  name: item.name,
                  parentId: item.parentId ?? null,
                  editingId: item.categoryId,
                })
              }
              onDelete={handleDelete}
              onAddProduct={onAddProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function findCategory(categories: MenuCategoryApiItem[], categoryId: number): MenuCategoryApiItem | null {
  for (const category of categories) {
    if (category.categoryId === categoryId) return category;
    const child = findCategory(category.children ?? [], categoryId);
    if (child) return child;
  }
  return null;
}
