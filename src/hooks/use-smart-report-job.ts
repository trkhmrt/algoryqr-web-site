"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  SMART_REPORT_POLL_INTERVAL_MS,
  createSmartReportRequest,
  findLatestSmartReportForScope,
  getSmartReportJobRequest,
  isSmartReportPending,
  listSmartReportsRequest,
  normalizeSmartReportResult,
  resolveSmartReportProcessId,
  toSmartReportUiStatus,
  type SmartReportAccepted,
  type SmartReportJobResponse,
  type SmartReportUiStatus,
} from "@/lib/smart-report";

type SmartReportScope = {
  branchId: number | null;
  menuId: number | null;
  from: string;
  to: string;
};

type SmartReportStartBody = {
  branchId?: number | null;
  menuId?: number | null;
  from: string;
  to: string;
  locale?: string;
};

function isNotFoundError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return status === 404;
}

export function useSmartReportJob(scope: SmartReportScope) {
  const queryClient = useQueryClient();
  const { branchId, menuId, from, to } = scope;
  const scopeReady = branchId != null || menuId != null;
  const [startedJobId, setStartedJobId] = useState<string | null>(null);

  useEffect(() => {
    setStartedJobId(null);
  }, [branchId, menuId, from, to]);

  const scopeJobQuery = useQuery({
    queryKey: ["smart-reports", "scope", branchId, menuId, from, to],
    queryFn: () => listSmartReportsRequest({ page: 0, size: 30, status: "all" }),
    enabled: scopeReady,
    select: (page) => findLatestSmartReportForScope(page.content, scope),
  });

  const scopedJobId = resolveSmartReportProcessId(scopeJobQuery.data);
  const jobId = startedJobId ?? scopedJobId;

  const createMutation = useMutation({
    mutationFn: createSmartReportRequest,
    onSuccess: async (data: SmartReportAccepted) => {
      const id = resolveSmartReportProcessId(data);
      if (id == null) return;
      setStartedJobId(id);
      await queryClient.invalidateQueries({ queryKey: ["smart-reports"] });
    },
  });

  const jobQuery = useQuery({
    queryKey: ["smart-report-job", jobId],
    queryFn: () => getSmartReportJobRequest(jobId as string),
    enabled: jobId != null,
    refetchInterval: (query) => {
      if (query.state.error && isNotFoundError(query.state.error)) {
        return false;
      }
      const status = query.state.data?.status;
      if (isSmartReportPending(status)) {
        return SMART_REPORT_POLL_INTERVAL_MS;
      }
      return false;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => !isNotFoundError(error) && failureCount < 1,
  });

  useEffect(() => {
    if (!jobQuery.isError || !isNotFoundError(jobQuery.error)) return;
    setStartedJobId(null);
    void queryClient.invalidateQueries({
      queryKey: ["smart-reports", "scope", branchId, menuId, from, to],
    });
  }, [jobQuery.isError, jobQuery.error, queryClient, branchId, menuId, from, to]);

  const job: SmartReportJobResponse | undefined = jobQuery.isError
    ? undefined
    : jobQuery.data;
  const status = job?.status ?? scopeJobQuery.data?.status;

  const uiStatus: SmartReportUiStatus = createMutation.isPending
    ? "pending"
    : toSmartReportUiStatus(status);

  const isGenerating =
    createMutation.isPending || isSmartReportPending(status);

  const isReady =
    status === "completed" && !!normalizeSmartReportResult(job ?? null);
  const isFailed =
    status === "failed" || createMutation.isError;

  async function start(body: SmartReportStartBody): Promise<SmartReportAccepted | null> {
    if (isGenerating || isReady) return null;
    return createMutation.mutateAsync(body);
  }

  function clearJob() {
    setStartedJobId(null);
    createMutation.reset();
    void queryClient.removeQueries({ queryKey: ["smart-report-job", jobId] });
    void queryClient.invalidateQueries({
      queryKey: ["smart-reports", "scope", branchId, menuId, from, to],
    });
  }

  async function retry(body: SmartReportStartBody): Promise<SmartReportAccepted> {
    clearJob();
    return createMutation.mutateAsync(body);
  }

  return {
    createMutation,
    jobQuery,
    job,
    jobId,
    uiStatus,
    isGenerating,
    isReady,
    isFailed,
    start,
    retry,
    clearJob,
  };
}
