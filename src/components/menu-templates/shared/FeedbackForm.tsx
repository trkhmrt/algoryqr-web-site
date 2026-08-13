"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { MenuRatingControl } from "./MenuRatingControl";

type FeedbackFormProps = {
  title?: string;
  ratingAvg: number | null;
  ratingCount: number;
  userRating?: number | null;
  submitting?: boolean;
  onSubmit: (score: number, comment?: string) => void | Promise<void>;
  className?: string;
  showComment?: boolean;
  buttonClassName?: string;
};

export function FeedbackForm({
  title = "Geri bildirim",
  ratingAvg,
  ratingCount,
  userRating,
  submitting = false,
  onSubmit,
  className,
  showComment = true,
  buttonClassName,
}: FeedbackFormProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(userRating ?? null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userRating != null) setSelectedScore(userRating);
  }, [userRating]);

  const handleSubmit = async () => {
    if (selectedScore == null) {
      setError("Lütfen bir puan seçin.");
      setSuccess(false);
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await onSubmit(selectedScore, comment.trim() || undefined);
      setComment("");
      setSuccess(true);
    } catch {
      setError("Geri bildirim gönderilemedi.");
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <MenuRatingControl
          ratingAvg={ratingAvg}
          ratingCount={ratingCount}
          userRating={selectedScore}
          onRate={(value) => {
            setSelectedScore(value);
            setError(null);
            setSuccess(false);
          }}
          submitting={submitting}
        />
      </div>
      {showComment ? (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder="İsteğe bağlı yorum (en fazla 500 karakter)"
          rows={3}
          disabled={submitting}
          className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
        />
      ) : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="mt-2 text-sm text-emerald-500">Geri bildiriminiz gönderildi. Teşekkürler.</p>
      ) : null}
      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleSubmit()}
        className={cn(
          "mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60",
          buttonClassName,
        )}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gönder"}
      </button>
    </div>
  );
}
