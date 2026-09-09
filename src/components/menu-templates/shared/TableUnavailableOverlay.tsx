"use client";

import { TABLE_INACTIVE_MESSAGE, useOrderingOptional } from "./ordering-context";

export function TableUnavailableOverlay() {
  const ordering = useOrderingOptional();
  if (!ordering?.tableInactive) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background px-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {TABLE_INACTIVE_MESSAGE}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Lütfen restoran görevlisiyle iletişime geçiniz.
        </p>
      </div>
    </div>
  );
}
