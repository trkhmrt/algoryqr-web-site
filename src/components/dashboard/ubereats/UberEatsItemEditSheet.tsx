"use client";

import { useEffect, useState } from "react";

import { ProductImageField } from "@/components/dashboard/menu/ProductImageField";
import { UberEatsModifierGroupFields } from "@/components/dashboard/ubereats/UberEatsModifierGroupFields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { CreateUberEatsProductPayload } from "@/lib/ubereats-api";
import {
  emptyUberEatsItemForm,
  toCreateUberEatsProductPayload,
  type SoldOutDuration,
} from "@/lib/ubereats-item-form";

type UberEatsItemEditSheetProps = {
  open: boolean;
  categoryName?: string;
  categoryOptions: string[];
  menuId: number;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateUberEatsProductPayload) => void;
  onInvalid: (error: string) => void;
};

export function UberEatsItemEditSheet({
  open,
  categoryName = "",
  categoryOptions,
  menuId,
  saving,
  onOpenChange,
  onSubmit,
  onInvalid,
}: UberEatsItemEditSheetProps) {
  const [form, setForm] = useState(emptyUberEatsItemForm(categoryName));

  useEffect(() => {
    if (open) setForm(emptyUberEatsItemForm(categoryName));
  }, [open, categoryName]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Ürünü düzenle</SheetTitle>
          <SheetDescription>Ad, fiyat, kategori ve özelleştirmeleri girin.</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-1 flex-col gap-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            const result = toCreateUberEatsProductPayload(form);
            if (!result.ok) {
              onInvalid(result.error);
              return;
            }
            onSubmit(result.payload);
          }}
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Ürün adı</Label>
            <Input
              value={form.name}
              disabled={saving}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Açıklama</Label>
            <Textarea
              value={form.description}
              disabled={saving}
              rows={3}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fiyat</Label>
            <MoneyInput
              value={form.price}
              disabled={saving}
              placeholder="120"
              onChange={(price) => setForm({ ...form, price })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kategori</Label>
            <Input
              list="uber-eats-item-categories"
              value={form.categoryName}
              disabled={saving}
              placeholder="Burger"
              onChange={(event) => setForm({ ...form, categoryName: event.target.value })}
            />
            <datalist id="uber-eats-item-categories">
              {categoryOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <ProductImageField
            menuId={menuId}
            value={form.imageUrl}
            disabled={saving}
            onChange={(imageUrl) => setForm({ ...form, imageUrl: imageUrl ?? "" })}
          />
          <div className="space-y-3 rounded-lg border border-border/70 p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.soldOut}
                disabled={saving}
                onCheckedChange={(checked) => setForm({ ...form, soldOut: Boolean(checked) })}
              />
              Tükendi
            </label>
            {form.soldOut ? (
              <RadioGroup
                value={form.soldOutDuration}
                disabled={saving}
                onValueChange={(value) => setForm({ ...form, soldOutDuration: value as SoldOutDuration })}
                className="grid gap-2"
              >
                <label className="flex items-center gap-2 text-xs">
                  <RadioGroupItem value="today" />
                  Bugün
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <RadioGroupItem value="indefinitely" />
                  Süresiz
                </label>
              </RadioGroup>
            ) : null}
          </div>
          <UberEatsModifierGroupFields
            groups={form.modifierGroups}
            disabled={saving}
            onChange={(modifierGroups) => setForm({ ...form, modifierGroups })}
          />
          <SheetFooter className="mt-auto">
            <Button type="submit" disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
