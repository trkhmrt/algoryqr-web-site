import type { ReactNode } from "react";

import { DASHBOARD_TYPE_HINT, DASHBOARD_TYPE_TITLE } from "@/lib/dashboard-surface";

type DashboardPageHeaderProps = {
  title: string;
  hint?: string | null;
  action?: ReactNode;
  back?: ReactNode;
};

export function DashboardPageHeader({ title, hint, action, back }: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {back}
        <div className="min-w-0">
          <h1 className={`truncate ${DASHBOARD_TYPE_TITLE}`}>{title}</h1>
          {hint ? <p className={`mt-1 ${DASHBOARD_TYPE_HINT}`}>{hint}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
