"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { generateCampaignImage } from "@/lib/campaign-api";
import { deleteProductImage, uploadProductImage } from "@/lib/uploadProductImage";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type CampaignImageProductRef = {
  name: string;
  imageUrl?: string | null;
};

type CampaignImageFieldProps = {
  menuId: number | null;
  value: string | null | undefined;
  onChange: (imageUrl: string | null) => void;
  campaignName: string;
  campaignSlogan?: string;
  products: CampaignImageProductRef[];
  disabled?: boolean;
};

function extensionForContentType(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "png";
}

function base64ToFile(base64: string, contentType: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const extension = extensionForContentType(contentType);
  return new File([bytes], `campaign-ai.${extension}`, { type: contentType });
}

export function CampaignImageField({
  menuId,
  value,
  onChange,
  campaignName,
  campaignSlogan,
  products,
  disabled = false,
}: CampaignImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Desteklenen formatlar: JPEG, PNG, WebP");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Görsel boyutu en fazla 5 MB olabilir");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (menuId == null || menuId <= 0) {
      setError("Menü seçili değil");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const result = await uploadProductImage(menuId, file);
      onChange(result.imageUrl);
      setPreviewUrl(result.imageUrl);
    } catch (uploadError) {
      setPreviewUrl(value || null);
      setError(uploadError instanceof Error ? uploadError.message : "Görsel yüklenemedi");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleGenerate() {
    if (menuId == null || menuId <= 0) {
      setError("Menü seçili değil");
      return;
    }
    if (!campaignName.trim()) {
      setError("Önce kampanya adını girin");
      return;
    }
    if (products.length === 0) {
      setError("AI görsel için en az bir ürün seçin");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const generated = await generateCampaignImage({
        name: campaignName.trim(),
        slogan: campaignSlogan?.trim() || undefined,
        productNames: products.map((product) => product.name).filter(Boolean).slice(0, 8),
        productImageUrls: products
          .map((product) => product.imageUrl)
          .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
          .slice(0, 4),
      });
      const file = base64ToFile(
        generated.imageBase64,
        generated.contentType || "image/png",
      );
      const uploaded = await uploadProductImage(menuId, file);
      onChange(uploaded.imageUrl);
      setPreviewUrl(uploaded.imageUrl);
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : "Görsel üretilemedi",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleRemove() {
    if (!value) {
      onChange(null);
      setPreviewUrl(null);
      return;
    }

    if (menuId == null || menuId <= 0) {
      onChange(null);
      setPreviewUrl(null);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await deleteProductImage(menuId, { imageUrl: value });
      onChange(null);
      setPreviewUrl(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Görsel silinemedi");
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || generating || disabled;

  return (
    <div className="space-y-2">
      <Label className="text-xs">Kampanya görseli (isteğe bağlı)</Label>
      <div className="flex flex-wrap items-start gap-3 rounded-md border border-border p-2">
        <div
          className={cn(
            "flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30",
            !previewUrl && "border-dashed",
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Kampanya görseli"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80 disabled:opacity-50"
            onChange={(e) => void handleFileChange(e)}
          />
          <p className="text-xs text-muted-foreground">
            Kendi görselinizi yükleyin veya ürün görsellerinden AI ile üretin.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy || menuId == null}
              onClick={() => void handleGenerate()}
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI ile oluştur
            </Button>
            {value ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleRemove()}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Kaldır
              </Button>
            ) : null}
          </div>
          {uploading ? (
            <p className="text-xs text-muted-foreground">Yükleniyor…</p>
          ) : null}
          {generating ? (
            <p className="text-xs text-muted-foreground">AI görsel üretiliyor…</p>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
