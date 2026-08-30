"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type DashboardPageLabelContextValue = {
  label?: string;
  setLabel: (label?: string) => void;
};

const DashboardPageLabelContext = createContext<DashboardPageLabelContextValue>({
  setLabel: () => undefined,
});

export function DashboardPageLabelProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | undefined>();
  const value = useMemo(() => ({ label, setLabel }), [label]);
  return (
    <DashboardPageLabelContext.Provider value={value}>{children}</DashboardPageLabelContext.Provider>
  );
}

export function useDashboardPageLabelValue() {
  return useContext(DashboardPageLabelContext).label;
}

export function useDashboardPageLabel(label?: string) {
  const { setLabel } = useContext(DashboardPageLabelContext);

  useEffect(() => {
    setLabel(label);
    return () => setLabel(undefined);
  }, [label, setLabel]);
}
