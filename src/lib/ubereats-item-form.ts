import { parseMoneyInput } from "@/components/ui/money-input";
import type { CreateUberEatsProductPayload } from "@/lib/ubereats-api";

export type SoldOutDuration = "today" | "indefinitely";

export type UberEatsModifierOptionForm = {
  name: string;
  price: string;
};

export type UberEatsModifierGroupForm = {
  name: string;
  required: boolean;
  minSelect: string;
  maxSelect: string;
  options: UberEatsModifierOptionForm[];
};

export type UberEatsItemForm = {
  name: string;
  description: string;
  price: string;
  categoryName: string;
  imageUrl: string;
  soldOut: boolean;
  soldOutDuration: SoldOutDuration;
  modifierGroups: UberEatsModifierGroupForm[];
};

export type UberEatsItemFormResult =
  | { ok: true; payload: CreateUberEatsProductPayload }
  | { ok: false; error: string };

export function emptyModifierOption(): UberEatsModifierOptionForm {
  return { name: "", price: "0" };
}

export function emptyModifierGroup(): UberEatsModifierGroupForm {
  return {
    name: "",
    required: false,
    minSelect: "0",
    maxSelect: "1",
    options: [emptyModifierOption()],
  };
}

export function emptyUberEatsItemForm(categoryName = ""): UberEatsItemForm {
  return {
    name: "",
    description: "",
    price: "",
    categoryName,
    imageUrl: "",
    soldOut: false,
    soldOutDuration: "indefinitely",
    modifierGroups: [],
  };
}

function parseCount(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapOptions(options: UberEatsModifierOptionForm[]) {
  return options.flatMap((option) => {
    const name = option.name.trim();
    if (!name) return [];
    const price = parseMoneyInput(option.price);
    return [{ name, price: Number.isFinite(price) ? price : 0 }];
  });
}

function mapGroups(groups: UberEatsModifierGroupForm[]): CreateUberEatsProductPayload["modifierGroups"] {
  return groups.flatMap((group) => {
    const name = group.name.trim();
    const options = mapOptions(group.options);
    if (!name || options.length === 0) return [];
    const minSelect = Math.max(group.required ? 1 : 0, parseCount(group.minSelect, group.required ? 1 : 0));
    const maxSelect = Math.max(minSelect, parseCount(group.maxSelect, Math.max(1, minSelect)));
    return [{ name, required: group.required, minSelect, maxSelect, options }];
  });
}

export function toCreateUberEatsProductPayload(form: UberEatsItemForm): UberEatsItemFormResult {
  const name = form.name.trim();
  if (!name) return { ok: false, error: "Ürün adı zorunludur." };
  const categoryName = form.categoryName.trim();
  if (!categoryName) return { ok: false, error: "Kategori zorunludur." };
  const price = parseMoneyInput(form.price);
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Geçerli bir fiyat girin." };
  const description = form.description.trim();
  const imageUrl = form.imageUrl.trim();
  return {
    ok: true,
    payload: {
      name,
      ...(description ? { description } : {}),
      price,
      currency: "TRY",
      categoryName,
      ...(imageUrl ? { imageUrl } : {}),
      available: !form.soldOut,
      modifierGroups: mapGroups(form.modifierGroups),
    },
  };
}
