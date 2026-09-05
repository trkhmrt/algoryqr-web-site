"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { MenuProductOptionGroupApiItem } from "@/lib/api";
import {
  OPTION_GROUP_KINDS,
  OPTION_UNITS,
  normalizeOptionKind,
  normalizeOptionUnit,
  type MenuProductOptionGroupKind,
  type MenuProductOptionUnit,
} from "@/lib/product-options";

export type ProductOptionFormItem = {
  name: string;
  priceDelta: string;
  available: boolean;
  sortOrder: number;
};

export type ProductOptionGroupForm = {
  name: string;
  kind: MenuProductOptionGroupKind;
  unit: MenuProductOptionUnit;
  minSelect: string;
  maxSelect: string;
  sortOrder: number;
  options: ProductOptionFormItem[];
};

export function emptyOptionGroups(): ProductOptionGroupForm[] {
  return [];
}

export function normalizeOptionGroups(
  groups?: MenuProductOptionGroupApiItem[] | null,
): ProductOptionGroupForm[] {
  if (!groups?.length) return [];
  return groups.map((group, groupIndex) => {
    const kind = normalizeOptionKind(group.kind);
    return {
      name: group.name ?? "",
      kind,
      unit: normalizeOptionUnit(group.unit, kind),
      minSelect: String(group.minSelect ?? 0),
      maxSelect: String(group.maxSelect ?? 1),
      sortOrder: group.sortOrder ?? groupIndex,
      options: (group.options ?? []).map((option, optionIndex) => ({
        name: option.name ?? "",
        priceDelta: option.priceDelta != null ? String(option.priceDelta) : "0",
        available: option.available !== false,
        sortOrder: option.sortOrder ?? optionIndex,
      })),
    };
  });
}

export function toOptionGroupsPayload(groups: ProductOptionGroupForm[]) {
  return groups
    .map((group, groupIndex) => {
      const kind = normalizeOptionKind(group.kind);
      return {
        name: group.name.trim(),
        kind,
        unit: normalizeOptionUnit(group.unit, kind),
        minSelect: Number.parseInt(group.minSelect, 10) || 0,
        maxSelect: Math.max(1, Number.parseInt(group.maxSelect, 10) || 1),
        sortOrder: group.sortOrder ?? groupIndex,
        options: group.options
          .map((option, optionIndex) => ({
            name: option.name.trim(),
            priceDelta: option.priceDelta.trim() === "" ? 0 : option.priceDelta,
            available: option.available,
            sortOrder: option.sortOrder ?? optionIndex,
          }))
          .filter((option) => option.name.length > 0),
      };
    })
    .filter((group) => group.name.length > 0 && group.options.length > 0);
}

type ProductOptionFieldsProps = {
  groups: ProductOptionGroupForm[];
  onChange: (next: ProductOptionGroupForm[]) => void;
  disabled?: boolean;
};

function defaultsForKind(kind: MenuProductOptionGroupKind) {
  return OPTION_GROUP_KINDS.find((item) => item.value === kind) ?? OPTION_GROUP_KINDS.at(-1)!;
}

export function ProductOptionFields({
  groups,
  onChange,
  disabled = false,
}: ProductOptionFieldsProps) {
  const updateGroup = (index: number, patch: Partial<ProductOptionGroupForm>) => {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  };

  const applyKind = (index: number, kind: MenuProductOptionGroupKind) => {
    const defaults = defaultsForKind(kind);
    const current = groups[index];
    if (!current) return;
    const nameBlankOrPreset =
      current.name.trim() === "" ||
      OPTION_GROUP_KINDS.some((item) => item.defaultName === current.name.trim());
    updateGroup(index, {
      kind,
      unit: defaults.unit,
      minSelect: defaults.minSelect,
      maxSelect: defaults.maxSelect,
      name: nameBlankOrPreset ? defaults.defaultName : current.name,
    });
  };

  const updateOption = (
    groupIndex: number,
    optionIndex: number,
    patch: Partial<ProductOptionFormItem>,
  ) => {
    onChange(
      groups.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          ...group,
          options: group.options.map((option, j) =>
            j === optionIndex ? { ...option, ...patch } : option,
          ),
        };
      }),
    );
  };

  const addGroup = () => {
    const defaults = defaultsForKind("SIZE");
    onChange([
      ...groups,
      {
        name: defaults.defaultName,
        kind: defaults.value,
        unit: defaults.unit,
        minSelect: defaults.minSelect,
        maxSelect: defaults.maxSelect,
        sortOrder: groups.length,
        options: [{ name: "", priceDelta: "0", available: true, sortOrder: 0 }],
      },
    ]);
  };

  return (
    <div className="space-y-3 rounded-md border border-border/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Opsiyon grupları</p>
          <p className="text-xs text-muted-foreground">
            Boyut, ekstra, porsiyon (adet/g/ml/L) gibi türler. Siparişe eklerken sorulur.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1"
          disabled={disabled}
          onClick={addGroup}
        >
          <Plus className="h-3.5 w-3.5" />
          Grup ekle
        </Button>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Henüz opsiyon yok. Eklemek için Grup ekle’ye tıklayın.
          </p>
        </div>
      ) : null}
      {groups.map((group, groupIndex) => {
        const kindMeta = defaultsForKind(group.kind);
        const showUnit = group.kind === "PORTION";
        return (
          <div
            key={`group-${groupIndex}`}
            className="space-y-3 rounded-md border border-border bg-background p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Tür</Label>
                  <Select
                    value={group.kind}
                    disabled={disabled}
                    onValueChange={(value) =>
                      applyKind(groupIndex, normalizeOptionKind(value))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tür seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPTION_GROUP_KINDS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-1 lg:col-span-1">
                  <Label className="text-xs">Grup adı</Label>
                  <Input
                    value={group.name}
                    disabled={disabled}
                    onChange={(e) => updateGroup(groupIndex, { name: e.target.value })}
                    placeholder={kindMeta.defaultName || "Grup adı"}
                  />
                </div>
                {showUnit ? (
                  <div className="space-y-1">
                    <Label className="text-xs">Birim</Label>
                    <Select
                      value={group.unit}
                      disabled={disabled}
                      onValueChange={(value) =>
                        updateGroup(groupIndex, {
                          unit: normalizeOptionUnit(value, "PORTION"),
                        })
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Birim" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPTION_UNITS.filter((item) => item.value !== "NONE").map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <Label className="text-xs">Min seçim</Label>
                  <Input
                    type="number"
                    min={0}
                    value={group.minSelect}
                    disabled={disabled}
                    onChange={(e) => updateGroup(groupIndex, { minSelect: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max seçim</Label>
                  <Input
                    type="number"
                    min={1}
                    value={group.maxSelect}
                    disabled={disabled}
                    onChange={(e) => updateGroup(groupIndex, { maxSelect: e.target.value })}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-destructive"
                disabled={disabled}
                onClick={() => onChange(groups.filter((_, i) => i !== groupIndex))}
                aria-label="Grubu sil"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">{kindMeta.hint}</p>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_6rem_auto_auto] items-center gap-2 px-0.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Seçenek
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Fiyat ±
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Aktif
                </span>
                <span className="w-8" />
              </div>
              {group.options.map((option, optionIndex) => (
                <div
                  key={`option-${groupIndex}-${optionIndex}`}
                  className="grid grid-cols-[1fr_6rem_auto_auto] items-center gap-2"
                >
                  <Input
                    value={option.name}
                    disabled={disabled}
                    onChange={(e) =>
                      updateOption(groupIndex, optionIndex, { name: e.target.value })
                    }
                    placeholder={
                      showUnit
                        ? group.unit === "GRAM"
                          ? "250 g"
                          : group.unit === "ML"
                            ? "330 ml"
                            : group.unit === "LITRE"
                              ? "1 L"
                              : "1 adet"
                        : "Seçenek adı"
                    }
                  />
                  <Input
                    value={option.priceDelta}
                    disabled={disabled}
                    onChange={(e) =>
                      updateOption(groupIndex, optionIndex, { priceDelta: e.target.value })
                    }
                    placeholder="+0"
                  />
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={option.available}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        updateOption(groupIndex, optionIndex, { available: checked })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    disabled={disabled || group.options.length <= 1}
                    onClick={() =>
                      updateGroup(groupIndex, {
                        options: group.options.filter((_, i) => i !== optionIndex),
                      })
                    }
                    aria-label="Seçeneği sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={disabled}
                onClick={() =>
                  updateGroup(groupIndex, {
                    options: [
                      ...group.options,
                      {
                        name: "",
                        priceDelta: "0",
                        available: true,
                        sortOrder: group.options.length,
                      },
                    ],
                  })
                }
              >
                Seçenek ekle
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
