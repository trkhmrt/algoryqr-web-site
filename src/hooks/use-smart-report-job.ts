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
  toSmartReportUiStatus,
  writeStoredSmartReportJob,
  type SmartReportAccepted,
  type SmartReportJobResponse,
  type SmartReportUiStatus,
} from "@/lib/smart-report";

type SmartReportScope = {
  menuId: number | null;
  from: string;
  to: string;
};

export function useSmartReportJob(scope: SmartReportScope) {
  const { menuId, from, to } = scope;
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (menuId == null) {
      setJobId(null);
      return;
    }
    const stored = readStoredSmartReportJob(menuId, from, to);
    setJobId(stored?.jobId ?? null);
  }, [menuId, from, to]);

  const persist = useCallback(
    (nextJobId: string, status: SmartReportJobResponse["status"]) => {
      if (menuId == null) return;
      writeStoredSmartReportJob(menuId, from, to, {
        jobId: nextJobId,
        status,
        savedAt: Date.now(),
      });
    },
    [menuId, from, to],
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
    if (jobId == null || job == null || menuId == null) return;
    persist(jobId, job.status);
  }, [job, jobId, menuId, persist]);

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

  async function start(body: {
    menuId: number;
    from: string;
    to: string;
    locale?: string;
  }) {
    if (isGenerating) return null;
    if (isReady) return jobId;
    return createMutation.mutateAsync(body);
  }

  function clearJob() {
    if (menuId != null) {
      clearStoredSmartReportJob(menuId, from, to);
    }
    setJobId(null);
    createMutation.reset();
  }

  async function retry(body: {
    menuId: number;
    from: string;
    to: string;
    locale?: string;
  }) {
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
