"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export default function DigitalMenuMenusView() {
  const router = useRouter();

  useEffect(() => {
    router.replace(DASHBOARD_ROUTES.digitalMenu);
  }, [router]);

  return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Yönlendiriliyor…
    </div>
  );
}
