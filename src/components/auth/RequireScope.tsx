"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useAccessProfile } from "@/hooks/use-access-profile";
import { hasScope, type AccessProfile, type ProductScope } from "@/lib/auth-user";

function resolveAllowed(
  profile: AccessProfile | null | undefined,
  scope?: ProductScope,
  anyOf?: ProductScope[],
): boolean {
  if (scope) return hasScope(profile, scope);
  if (anyOf && anyOf.length > 0) {
    return anyOf.some((item) => hasScope(profile, item));
  }
  return true;
}

export function useRequireScope(scope?: ProductScope, anyOf?: ProductScope[]) {
  const { data: profile, isLoading } = useAccessProfile();
  return {
    allowed: resolveAllowed(profile, scope, anyOf),
    isLoading,
    profile,
  };
}

const defaultLoading = (
  <div className="flex items-center justify-center py-20 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" />
  </div>
);

export function RequireScope({
  scope,
  anyOf,
  children,
  fallback = null,
  loading = defaultLoading,
}: {
  scope?: ProductScope;
  anyOf?: ProductScope[];
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}) {
  const { allowed, isLoading } = useRequireScope(scope, anyOf);
  if (isLoading) return loading;
  return allowed ? children : fallback;
}
