"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  SMART_REPORT_POLL_INTERVAL_MS,
  clearStoredSmartReportJob,
  createSmartReportRequest,
  getSmartReportJobRequest,
  isSmartReportPending,
  normalizeSmartReportResult,
  readStoredSmartReportJob,
  resolveSmartReportProcessId,
  smartReportScopeKey,
  toSmartReportUiStatus,
  writeStoredSmartReportJob,
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

export function useSmartReportJob(scope: SmartReportScope) {
  const { branchId, menuId, from, to } = scope;
  const storageScope = smartReportScopeKey(branchId, menuId);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (storageScope == null) {
      setJobId(null);
      return;
    }
    const stored = readStoredSmartReportJob(storageScope, from, to);
    setJobId(stored?.jobId ?? null);
  }, [storageScope, from, to]);

  const persist = useCallback(
    (nextJobId: string, status: SmartReportJobResponse["status"]) => {
      if (storageScope == null) return;
      writeStoredSmartReportJob(storageScope, from, to, {
        jobId: nextJobId,
        status,
        savedAt: Date.now(),
      });
    },
    [storageScope, from, to],
  );

  const createMutation = useMutation({
    mutationFn: createSmartReportRequest,
    onSuccess: (data: SmartReportAccepted) => {
      const id = resolveSmartReportProcessId(data);
      if (!id) return;
      setJobId(id);
      persist(id, data.status);
    },
  });

  const jobQuery = useQuery({
    queryKey: ["smart-report-job", jobId],
    queryFn: () => getSmartReportJobRequest(jobId as string),
    enabled: jobId != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (isSmartReportPending(status) || status == null) {
        return SMART_REPORT_POLL_INTERVAL_MS;
      }
      return false;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const job: SmartReportJobResponse | undefined = jobQuery.data;

  useEffect(() => {
    if (jobId == null || job == null || storageScope == null) return;
    persist(jobId, job.status);
  }, [job, jobId, storageScope, persist]);

  const uiStatus: SmartReportUiStatus =
    createMutation.isPending
      ? "pending"
      : toSmartReportUiStatus(job?.status ?? (jobId != null ? "queued" : null));

  const isGenerating =
    createMutation.isPending ||
    (jobId != null && (job == null || isSmartReportPending(job.status)));

  const isReady =
    job?.status === "completed" && !!normalizeSmartReportResult(job);
  const isFailed =
    job?.status === "failed" || createMutation.isError;

  async function start(body: SmartReportStartBody) {
    if (isGenerating) return null;
    if (isReady) return jobId;
    return createMutation.mutateAsync(body);
  }

  function clearJob() {
    if (storageScope != null) {
      clearStoredSmartReportJob(storageScope, from, to);
    }
    setJobId(null);
    createMutation.reset();
  }

  async function retry(body: SmartReportStartBody) {
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
