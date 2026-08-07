"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NutritionBasis,
  NutritionFacts,
  NutritionNutrientEntry,
  patchMenuProductNutritionRequest,
} from "@/lib/api";
import { useDashboardBanners } from "@/contexts/dashboard-banners";

type ProductNutritionPanelProps = {
  productId: number;
  nutrition?: NutritionFacts | null;
  onSaved?: (nutrition: NutritionFacts) => void;
};

type NutritionFormState = {
  basis: NutritionBasis;
  energyKj: string;
  energyKcal: string;
  fat: string;
  saturatedFat: string;
  carbohydrate: string;
  sugars: string;
  polyols: string;
  starch: string;
  fibre: string;
  protein: string;
  salt: string;
  otherNutrients: NutritionNutrientEntry[];
};

const emptyForm = (nutrition?: NutritionFacts | null): NutritionFormState => ({
  basis: nutrition?.basis === "PER_100ML" ? "PER_100ML" : "PER_100G",
  energyKj: toInput(nutrition?.energyKj),
  energyKcal: toInput(nutrition?.energyKcal),
  fat: toInput(nutrition?.fat),
  saturatedFat: toInput(nutrition?.saturatedFat),
  carbohydrate: toInput(nutrition?.carbohydrate),
  sugars: toInput(nutrition?.sugars),
  polyols: toInput(nutrition?.polyols),
  starch: toInput(nutrition?.starch),
  fibre: toInput(nutrition?.fibre),
  protein: toInput(nutrition?.protein),
  salt: toInput(nutrition?.salt),
  otherNutrients: (nutrition?.otherNutrients ?? []).map((entry) => ({
    name: entry.name ?? "",
    value: entry.value ?? "",
    unit: entry.unit ?? "",
  })),
});

function toInput(value?: number | string | null) {
  if (value == null || value === "") return "";
  return String(value);
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function toNumberOrUndefined(value: string): number | undefined {
  const parsed = toNumberOrNull(value);
  return parsed == null ? undefined : parsed;
}

function hasOptionalNutrition(nutrition?: NutritionFacts | null) {
  if (!nutrition) return false;
  return Boolean(
    nutrition.saturatedFat != null ||
      nutrition.sugars != null ||
      nutrition.polyols != null ||
      nutrition.starch != null ||
      (nutrition.otherNutrients && nutrition.otherNutrients.length > 0),
  );
}

export function emptyNutritionFacts(): NutritionFacts {
  return {
    basis: "PER_100G",
    energyKj: 0,
    energyKcal: 0,
    fat: 0,
    carbohydrate: 0,
    fibre: 0,
    protein: 0,
    salt: 0,
    otherNutrients: [],
  };
}

export function buildNutritionFactsFromForm(form: {
  basis: NutritionBasis;
  energyKj: string;
  energyKcal: string;
  fat: string;
  saturatedFat?: string;
  carbohydrate: string;
  sugars?: string;
  polyols?: string;
  starch?: string;
  fibre: string;
  protein: string;
  salt: string;
  otherNutrients?: NutritionNutrientEntry[];
}): NutritionFacts | null {
  const energyKj = toNumberOrNull(form.energyKj);
  const energyKcal = toNumberOrNull(form.energyKcal);
  const fat = toNumberOrNull(form.fat);
  const carbohydrate = toNumberOrNull(form.carbohydrate);
  const fibre = toNumberOrNull(form.fibre);
  const protein = toNumberOrNull(form.protein);
  const salt = toNumberOrNull(form.salt);
  if (
    energyKj == null ||
    energyKcal == null ||
    fat == null ||
    carbohydrate == null ||
    fibre == null ||
    protein == null ||
    salt == null
  ) {
    return null;
  }
  return {
    basis: form.basis,
    energyKj,
    energyKcal,
    fat,
    saturatedFat: toNumberOrUndefined(form.saturatedFat ?? ""),
    carbohydrate,
    sugars: toNumberOrUndefined(form.sugars ?? ""),
    polyols: toNumberOrUndefined(form.polyols ?? ""),
    starch: toNumberOrUndefined(form.starch ?? ""),
    fibre,
    protein,
    salt,
    otherNutrients: (form.otherNutrients ?? [])
      .filter((entry) => entry.name?.trim())
      .map((entry) => ({
        name: entry.name.trim(),
        value: toNumberOrNull(String(entry.value ?? "")),
        unit: entry.unit?.trim() || undefined,
      })),
  };
}

export default function ProductNutritionPanel({
  productId,
  nutrition,
  onSaved,
}: ProductNutritionPanelProps) {
  const { notify } = useDashboardBanners();
  const [form, setForm] = useState<NutritionFormState>(() => emptyForm(nutrition));
  const [showExtra, setShowExtra] = useState(() => hasOptionalNutrition(nutrition));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(emptyForm(nutrition));
    setShowExtra(hasOptionalNutrition(nutrition));
  }, [nutrition]);

  const updateField = <K extends keyof NutritionFormState>(key: K, value: NutritionFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const payload = buildNutritionFactsFromForm(form);
    if (!payload) {
      notify("warning", "Zorunlu besin alanlarını doldurun.");
      return;
    }
    setSaving(true);
    try {
      const updated = await patchMenuProductNutritionRequest(productId, payload);
      notify("info", "Besin değerleri güncellendi.");
      onSaved?.(updated.nutrition ?? payload);
    } catch (error) {
      notify("danger", error instanceof Error ? error.message : "Besin değerleri kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">Besin değerleri</h3>
          <p className="text-xs text-muted-foreground">100g / 100ml başına · kJ ve kcal zorunlu</p>
        </div>
        <Button size="sm" className="h-8" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Kaydediliyor..." : "Besinleri kaydet"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">Birim</Label>
          <select
            className="flex h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
            value={form.basis}
            onChange={(e) => updateField("basis", e.target.value as NutritionBasis)}
          >
            <option value="PER_100G">100g</option>
            <option value="PER_100ML">100ml</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Enerji (kJ)</Label>
          <Input className="h-9" value={form.energyKj} onChange={(e) => updateField("energyKj", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Enerji (kcal)</Label>
          <Input className="h-9" value={form.energyKcal} onChange={(e) => updateField("energyKcal", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Yağ (g)</Label>
          <Input className="h-9" value={form.fat} onChange={(e) => updateField("fat", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Karbonhidrat (g)</Label>
          <Input className="h-9" value={form.carbohydrate} onChange={(e) => updateField("carbohydrate", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Lif (g)</Label>
          <Input className="h-9" value={form.fibre} onChange={(e) => updateField("fibre", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Protein (g)</Label>
          <Input className="h-9" value={form.protein} onChange={(e) => updateField("protein", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tuz (g)</Label>
          <Input className="h-9" value={form.salt} onChange={(e) => updateField("salt", e.target.value)} />
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowExtra((prev) => !prev)}
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExtra ? "rotate-180" : ""}`} />
        Ek alanlar
      </button>

      {showExtra ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Doymuş yağ (g)</Label>
              <Input
                className="h-9"
                value={form.saturatedFat}
                onChange={(e) => updateField("saturatedFat", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Şekerler (g)</Label>
              <Input className="h-9" value={form.sugars} onChange={(e) => updateField("sugars", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Polioller (g)</Label>
              <Input className="h-9" value={form.polyols} onChange={(e) => updateField("polyols", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nişasta (g)</Label>
              <Input className="h-9" value={form.starch} onChange={(e) => updateField("starch", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Diğer besin öğeleri</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() =>
                  updateField("otherNutrients", [...form.otherNutrients, { name: "", value: "", unit: "" }])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Ekle
              </Button>
            </div>
            {form.otherNutrients.length === 0 ? (
              <p className="text-xs text-muted-foreground">İsteğe bağlı ek besin öğesi yok.</p>
            ) : (
              form.otherNutrients.map((entry, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input
                    className="h-9"
                    placeholder="Ad"
                    value={entry.name}
                    onChange={(e) => {
                      const next = [...form.otherNutrients];
                      next[index] = { ...next[index], name: e.target.value };
                      updateField("otherNutrients", next);
                    }}
                  />
                  <Input
                    className="h-9"
                    placeholder="Değer"
                    value={String(entry.value ?? "")}
                    onChange={(e) => {
                      const next = [...form.otherNutrients];
                      next[index] = { ...next[index], value: e.target.value };
                      updateField("otherNutrients", next);
                    }}
                  />
                  <Input
                    className="h-9"
                    placeholder="Birim"
                    value={entry.unit ?? ""}
                    onChange={(e) => {
                      const next = [...form.otherNutrients];
                      next[index] = { ...next[index], unit: e.target.value };
                      updateField("otherNutrients", next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() =>
                      updateField(
                        "otherNutrients",
                        form.otherNutrients.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
