"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPackagePrice, packageFeatures } from "@/lib/package-display";
import type { PlanPackageApiItem } from "@/lib/api";

interface TrialPackagePickerProps {
  packages: PlanPackageApiItem[];
  startingPackageId: number | null;
  disabled?: boolean;
  onStart: (packageId: number) => void;
}

export default function TrialPackagePicker({
  packages,
  startingPackageId,
  disabled,
  onStart,
}: TrialPackagePickerProps) {
  if (packages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Şu an denemeye açık paket bulunmuyor.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {packages.map((pkg) => {
        const features = packageFeatures(pkg);
        const starting = startingPackageId === pkg.id;
        return (
          <Card key={pkg.id} className="glow-card">
            <CardContent className="flex h-full flex-col p-4">
              <h3 className="text-base font-semibold text-foreground">{pkg.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pkg.validityDays} gün ücretsiz deneme
              </p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {formatPackagePrice(pkg.price, pkg.currency)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  / sonra
                </span>
              </p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {features.slice(0, 4).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                variant="hero"
                disabled={disabled || starting}
                onClick={() => onStart(pkg.id)}
              >
                {starting ? "Başlatılıyor…" : `${pkg.validityDays} gün dene`}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
