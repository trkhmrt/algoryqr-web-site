"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Send, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createPlatformFeedbackRequest,
  PLATFORM_FEEDBACK_SUBJECTS,
  type PlatformFeedbackSubject,
} from "@/lib/api";
import { uploadFeedbackScreenshot } from "@/lib/uploadFeedbackScreenshot";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ReportIssueFormProps = {
  className?: string;
  onSuccess?: () => void;
};

export function ReportIssueForm({ className, onSuccess }: ReportIssueFormProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<{ imageUrl: string; objectKey: string } | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "" as PlatformFeedbackSubject | "",
    description: "",
  });

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!ACCEPTED_TYPES.has(file.type)) {
      setUploadError("Desteklenen formatlar: JPEG, PNG, WebP");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("Görsel boyutu en fazla 5 MB olabilir");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const result = await uploadFeedbackScreenshot(file);
      setScreenshot(result);
      setPreviewUrl(result.imageUrl);
    } catch (error) {
      setPreviewUrl(null);
      setScreenshot(null);
      setUploadError(error instanceof Error ? error.message : "Ekran görüntüsü yüklenemedi");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemoveScreenshot() {
    setScreenshot(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.subject || !form.description.trim()) {
      toast({
        title: "Eksik bilgi",
        description: "Başlık, konu ve açıklama alanlarını doldurun.",
        variant: "destructive",
      });
      return;
    }

    setPending(true);
    try {
      await createPlatformFeedbackRequest({
        title: form.title.trim(),
        subject: form.subject,
        description: form.description.trim(),
        ...(screenshot
          ? { screenshotUrl: screenshot.imageUrl, screenshotKey: screenshot.objectKey }
          : {}),
      });

      toast({
        title: "Geri bildiriminiz alındı",
        description: "En kısa sürede size dönüş yapacağız.",
      });

      setForm({ title: "", subject: "", description: "" });
      handleRemoveScreenshot();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Gönderilemedi",
        description: error instanceof Error ? error.message : "Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="feedback-title">Başlık</Label>
        <Input
          id="feedback-title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Kısa bir başlık girin"
          maxLength={120}
          disabled={busy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-subject">Konu</Label>
        <Select
          value={form.subject}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, subject: value as PlatformFeedbackSubject }))
          }
          disabled={busy}
        >
          <SelectTrigger id="feedback-subject">
            <SelectValue placeholder="Konu seçin" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_FEEDBACK_SUBJECTS.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-description">Açıklama</Label>
        <Textarea
          id="feedback-description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Sorunu veya önerinizi detaylı anlatın"
          rows={4}
          maxLength={5000}
          disabled={busy}
        />
      </div>

      <div className="space-y-2">
        <Label>Ekran görüntüsü (isteğe bağlı)</Label>
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-border/70 bg-surface-muted/30 p-3">
          <div
            className={cn(
              "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background",
              !previewUrl && "border-dashed",
            )}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Ekran görüntüsü" className="h-full w-full object-cover" />
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
            <p className="text-xs text-muted-foreground">JPEG, PNG veya WebP · en fazla 5 MB</p>
            {previewUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                className="w-fit"
                onClick={handleRemoveScreenshot}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Görseli kaldır
              </Button>
            ) : null}
            {uploading ? <p className="text-xs text-muted-foreground">Yükleniyor…</p> : null}
            {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gönderiliyor
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Geri bildirim gönder
          </>
        )}
      </Button>
    </form>
  );
}
