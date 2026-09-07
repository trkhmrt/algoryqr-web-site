"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTrialReminder } from "@/hooks/use-trial-reminder";
import { useTrialReminderUi } from "@/contexts/trial-reminder-ui";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { formatDaysUntilExpiry, formatPackageDate } from "@/lib/package-display";
import {
  dismissTrialReminder,
  isTrialReminderDismissed,
  shouldAutoOpenTrialReminder,
} from "@/lib/trial-reminder";

export default function TrialReminderDialog() {
  const { info, isLoading } = useTrialReminder();
  const { dialogOpen, setDialogOpen } = useTrialReminderUi();

  useEffect(() => {
    if (!info || isLoading) return;
    if (!shouldAutoOpenTrialReminder(info)) return;
    if (isTrialReminderDismissed(info)) return;
    setDialogOpen(true);
  }, [info, isLoading, setDialogOpen]);

  const handleDismiss = () => {
    if (info) dismissTrialReminder(info);
    setDialogOpen(false);
  };

  if (!info) return null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="smart-feature-panel rounded-none border-0 p-6 shadow-none">
          <DialogHeader className="space-y-4 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Deneme sürümünüz
                </DialogTitle>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Deneme
                </span>
              </div>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                Deneme sürümünüzün bitmesine{" "}
                <span className="font-medium text-foreground">
                  {formatDaysUntilExpiry(info.daysUntilExpiry).toLowerCase()}
                </span>
                . Size uygun paketi seçip gelişmiş özelliklere sahip olun.
                {info.expiresAt ? (
                  <>
                    {" "}
                    Bitiş tarihi:{" "}
                    <span className="font-medium text-foreground">
                      {formatPackageDate(info.expiresAt)}
                    </span>
                    .
                  </>
                ) : null}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-6 flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button variant="hero" className="w-full" asChild onClick={handleDismiss}>
              <Link href={DASHBOARD_ROUTES.accountPackages}>Paketleri incele</Link>
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleDismiss}>
              Daha sonra
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
