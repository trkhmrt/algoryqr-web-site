export type SearchCompletePayload = {
  input: {
    message: string;
    query: string;
    filters: Record<string, unknown>;
    limit: number;
  };
  response: {
    searchPhase: string;
    searchSource: string;
    appliedFilters: Record<string, unknown>;
    resolvedIds: Record<string, number>;
    totalMatches: number;
    productCount: number;
    notFound: {
      reason: string;
      unresolvedTerms: string[];
      alternativesShown: boolean;
    } | null;
    durationMs: number;
  };
};

export function isSearchCompleteVisible(): boolean {
  const env = (
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.NEXT_PUBLIC_DEPLOY_ENV ??
    ''
  )
    .trim()
    .toLowerCase();

  if (env === 'prod' || env === 'production') return false;
  if (env === 'stage' || env === 'staging' || env === 'local') return true;
  return process.env.NODE_ENV === 'development';
}
