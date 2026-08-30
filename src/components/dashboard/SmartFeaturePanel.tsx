"use client";

import { Sparkles } from "lucide-react";

import { RainbowBeamButton } from "@/components/dashboard/RainbowBeamButton";
import { FeatureHint, type FeatureHintContent } from "@/components/ui/FeatureHint";
import { Skeleton } from "@/components/ui/skeleton";

export type SmartFeatureHintContent = FeatureHintContent;

export function SmartFeaturePanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`smart-feature-panel flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between ${
        className ?? ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

export type SmartFeaturePanelProps = {
  title: string;
  hint?: FeatureHintContent;
  description: string;
  actionLabel: string;
  loading?: boolean;
  disabled?: boolean;
  prominent?: boolean;
  onActionClick?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  loadingSkeleton?: boolean;
  className?: string;
};

export function SmartFeaturePanel({
  title,
  hint,
  description,
  actionLabel,
  loading,
  disabled,
  prominent = true,
  onActionClick,
  secondaryAction,
  loadingSkeleton,
  className,
}: SmartFeaturePanelProps) {
  if (loadingSkeleton) {
    return <SmartFeaturePanelSkeleton className={className} />;
  }

  return (
    <div
      className={`smart-feature-panel flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between ${
        className ?? ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            {hint ? <FeatureHint title={hint.title} description={hint.description} /> : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={secondaryAction.disabled}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60 dark:hover:bg-muted"
          >
            {secondaryAction.label}
          </button>
        ) : null}
        <RainbowBeamButton
          label={actionLabel}
          loading={loading}
          disabled={disabled}
          prominent={prominent}
          onClick={onActionClick}
        />
      </div>
    </div>
  );
}
