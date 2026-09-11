"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import {
  emptyModifierGroup,
  emptyModifierOption,
  type UberEatsModifierGroupForm,
} from "@/lib/ubereats-item-form";

type UberEatsModifierGroupFieldsProps = {
  groups: UberEatsModifierGroupForm[];
  onChange: (groups: UberEatsModifierGroupForm[]) => void;
  disabled?: boolean;
};

function replaceGroup(
  groups: UberEatsModifierGroupForm[],
  index: number,
  next: UberEatsModifierGroupForm,
): UberEatsModifierGroupForm[] {
  return groups.map((group, current) => (current === index ? next : group));
}

export function UberEatsModifierGroupFields({
  groups,
  onChange,
  disabled = false,
}: UberEatsModifierGroupFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Özelleştirmeler</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={disabled}
          onClick={() => onChange([...groups, emptyModifierGroup()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Grup ekle
        </Button>
      </div>
      {groups.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Sos, boyut veya ekstra gibi özelleştirme grupları ekleyin.
        </p>
      ) : (
        groups.map((group, groupIndex) => (
          <section key={groupIndex} className="space-y-3 rounded-lg border border-border/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label className="text-xs">Grup adı</Label>
                <Input
                  value={group.name}
                  disabled={disabled}
                  placeholder="Sos seçimi"
                  onChange={(event) =>
                    onChange(replaceGroup(groups, groupIndex, { ...group, name: event.target.value }))
                  }
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="mt-5 shrink-0"
                disabled={disabled}
                onClick={() => onChange(groups.filter((_, current) => current !== groupIndex))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Zorunlu seçim</Label>
              <Switch
                checked={group.required}
                disabled={disabled}
                onCheckedChange={(required) =>
                  onChange(
                    replaceGroup(groups, groupIndex, {
                      ...group,
                      required,
                      minSelect: required ? String(Math.max(1, Number.parseInt(group.minSelect, 10) || 1)) : "0",
                    }),
                  )
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Minimum</Label>
                <Input
                  type="number"
                  min={group.required ? 1 : 0}
                  value={group.minSelect}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(replaceGroup(groups, groupIndex, { ...group, minSelect: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Maksimum</Label>
                <Input
                  type="number"
                  min={1}
                  value={group.maxSelect}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(replaceGroup(groups, groupIndex, { ...group, maxSelect: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              {group.options.map((option, optionIndex) => (
                <div key={optionIndex} className="grid grid-cols-[1fr_7rem_auto] items-end gap-2">
                  <div className="space-y-1.5">
                    {optionIndex === 0 ? <Label className="text-xs">Seçenek</Label> : null}
                    <Input
                      value={option.name}
                      disabled={disabled}
                      placeholder="Cheddar"
                      onChange={(event) =>
                        onChange(
                          replaceGroup(groups, groupIndex, {
                            ...group,
                            options: group.options.map((current, currentIndex) =>
                              currentIndex === optionIndex ? { ...current, name: event.target.value } : current,
                            ),
                          }),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    {optionIndex === 0 ? <Label className="text-xs">Ücret</Label> : null}
                    <MoneyInput
                      value={option.price}
                      disabled={disabled}
                      onChange={(price) =>
                        onChange(
                          replaceGroup(groups, groupIndex, {
                            ...group,
                            options: group.options.map((current, currentIndex) =>
                              currentIndex === optionIndex ? { ...current, price } : current,
                            ),
                          }),
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled || group.options.length === 1}
                    onClick={() =>
                      onChange(
                        replaceGroup(groups, groupIndex, {
                          ...group,
                          options: group.options.filter((_, current) => current !== optionIndex),
                        }),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                disabled={disabled}
                onClick={() =>
                  onChange(
                    replaceGroup(groups, groupIndex, {
                      ...group,
                      options: [...group.options, emptyModifierOption()],
                    }),
                  )
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Seçenek ekle
              </Button>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
