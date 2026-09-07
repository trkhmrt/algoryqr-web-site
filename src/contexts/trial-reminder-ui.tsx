"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type TrialReminderUiContextValue = {
  dialogOpen: boolean;
  openDialog: () => void;
  setDialogOpen: (open: boolean) => void;
};

const TrialReminderUiContext = createContext<TrialReminderUiContextValue | null>(null);

export function TrialReminderUiProvider({ children }: { children: ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = useCallback(() => setDialogOpen(true), []);
  const value = useMemo(
    () => ({ dialogOpen, openDialog, setDialogOpen }),
    [dialogOpen, openDialog],
  );
  return (
    <TrialReminderUiContext.Provider value={value}>{children}</TrialReminderUiContext.Provider>
  );
}

export function useTrialReminderUi(): TrialReminderUiContextValue {
  const ctx = useContext(TrialReminderUiContext);
  if (!ctx) {
    return {
      dialogOpen: false,
      openDialog: () => undefined,
      setDialogOpen: () => undefined,
    };
  }
  return ctx;
}
