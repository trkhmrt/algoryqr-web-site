import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Shared: 4 metric cards ─── */
function MetricCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="glow-card">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─── Chart card skeleton ─── */
function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card className="glow-card">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className={`w-full rounded-lg ${height}`} />
      </CardContent>
    </Card>
  );
}

/* ─── List row skeleton ─── */
function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/* ─── Overview Tab ─── */
export function OverviewSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <MetricCardsSkeleton />
      <ChartSkeleton />
      <Card className="glow-card">
        <div className="border-b border-border px-6 py-4">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </Card>
    </div>
  );
}

/* ─── Analytics Tab ─── */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <MetricCardsSkeleton />
      <ChartSkeleton height="h-72" />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-56" />
        <ChartSkeleton height="h-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height="h-64" />
        <ChartSkeleton height="h-64" />
      </div>
      <ChartSkeleton height="h-64" />
      <ChartSkeleton height="h-52" />
    </div>
  );
}

/* ─── QR Codes List Tab ─── */
export function QRCodesSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="glow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-md" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Create QR Tab ─── */
export function CreateQRSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="glow-card">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="glow-card">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
