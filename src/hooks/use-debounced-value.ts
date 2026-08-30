"use client";

import { useEffect, useState } from "react";

export function useDebouncedValue<TValue>(value: TValue, delayMs = 250): TValue {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
