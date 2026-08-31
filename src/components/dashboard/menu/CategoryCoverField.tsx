"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteCategoryCover, uploadCategoryCover } from "@/lib/uploadCategoryCover";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type CategoryCoverFieldProps = {
  menuId: number;
  categoryId: number;
  value: string | null | undefined;
  onChange: (imageUrl: string | null) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function CategoryCoverField({
  menuId,
  categoryId,
  value,
  onChange,
  disabled = false,
  compact = false,
}: CategoryCoverFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(value || null);
  }, [value]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("JPEG, PNG veya WebP");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("En fazla 5 MB");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (menuId <= 0 || categoryId <= 0) {
      setError("Kategori seçili değil");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const category = await uploadCategoryCover(menuId, categoryId, file);
      onChange(category.imageUrl ?? null);
      setPreviewUrl(category.imageUrl ?? null);
    } catch (uploadError) {
      setPreviewUrl(value || null);
      setError(uploadError instanceof Error ? uploadError.message : "Yüklenemedi");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(event: React.MouseEvent) {
    event.stopPropagation();
    if (!value) {
      onChange(null);
      setPreviewUrl(null);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await deleteCategoryCover(menuId, categoryId);
      onChange(null);
      setPreviewUrl(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Silinemedi");
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || disabled;
  const sizeClass = compact ? "h-12 w-12" : "h-16 w-16";

  return (
    <div className={cn("flex items-start gap-2", compact ? "flex-row items-center" : "flex-col")}>
      <button
        type="button"
        disabled={busy}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30",
          sizeClass,
          !previewUrl && "border-dashed",
          busy ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/50",
        )}
        onClick={() => inputRef.current?.click()}
        aria-label={previewUrl ? "Kapak görselini değiştir" : "Kapak görseli ekle"}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          </span>
        )}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-[10px] text-muted-foreground">
            …
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
      {!compact && value ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          className="h-7 gap-1 px-2 text-xs"
          onClick={(event) => void handleRemove(event)}
        >
          <Trash2 className="h-3 w-3" />
          Kaldır
        </Button>
      ) : null}
      {compact && value ? (
        <button
          type="button"
          disabled={busy}
          className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
          onClick={(event) => void handleRemove(event)}
        >
          Kaldır
        </button>
      ) : null}
      {error ? <p className="text-[10px] text-destructive">{error}</p> : null}
    </div>
  );
}
