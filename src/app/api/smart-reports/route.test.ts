import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const getUserIdMock = vi.hoisted(() => vi.fn());
const axiosGet = vi.hoisted(() => vi.fn());
const axiosPost = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/server/auth-cookies", () => ({
  readAccessTokenFromCookies: readAccessTokenMock,
}));

vi.mock("@/lib/auth-user", () => ({
  getUserIdFromAccessToken: getUserIdMock,
}));

vi.mock("@/lib/config", () => ({
  API_BASE_URL: "http://qr.test",
  AI_SERVICE_BASE_URL: "http://ai.test",
  AI_SERVICE_API_KEY: "test-key",
}));

vi.mock("axios", () => ({
  default: {
    get: axiosGet,
    post: axiosPost,
  },
  AxiosError: class AxiosError extends Error {
    code?: string;
    response?: { status: number; data: unknown };
  },
}));

describe("smart-reports BFF", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({});
    readAccessTokenMock.mockReturnValue("access-token");
    getUserIdMock.mockReturnValue(42);
  });

  it("POST enqueues smart report via qr-service", async () => {
    axiosPost.mockResolvedValue({
      status: 202,
      data: { jobId: "11111111-1111-1111-1111-111111111111", status: "queued" },
    });

    const { POST } = await import("@/app/api/smart-reports/route");
    const response = await POST(
      new Request("http://localhost/api/smart-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: 1,
          from: "2026-07-01",
          to: "2026-07-31",
        }),
      }),
    );

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.jobId).toBe("11111111-1111-1111-1111-111111111111");
    expect(axiosGet).not.toHaveBeenCalled();
    expect(axiosPost).toHaveBeenCalledWith(
      "http://qr.test/analytics/menu/1/smart-reports",
      expect.objectContaining({
        from: "2026-07-01",
        to: "2026-07-31",
        locale: "tr",
      }),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer access-token" }),
      }),
    );
  });

  it("GET proxies job status", async () => {
    axiosGet.mockResolvedValue({
      status: 200,
      data: {
        jobId: "11111111-1111-1111-1111-111111111111",
        status: "completed",
        result: { title: "Rapor", summary: "Özet", sections: [], rawMarkdown: "# Rapor" },
      },
    });

    const { GET } = await import("@/app/api/smart-reports/[jobId]/route");
    const response = await GET(new Request("http://localhost/api/smart-reports/x"), {
      params: Promise.resolve({ jobId: "11111111-1111-1111-1111-111111111111" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("completed");
    expect(axiosGet).toHaveBeenCalledWith(
      "http://qr.test/analytics/smart-reports/11111111-1111-1111-1111-111111111111",
      expect.any(Object),
    );
  });

  it("GET list defaults to completed status filter", async () => {
    axiosGet.mockResolvedValue({
      status: 200,
      data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 },
    });

    const { GET } = await import("@/app/api/smart-reports/route");
    const response = await GET(
      new Request("http://localhost/api/smart-reports?page=0&size=20"),
    );

    expect(response.status).toBe(200);
    expect(axiosGet).toHaveBeenCalledWith(
      "http://qr.test/analytics/smart-reports",
      expect.objectContaining({
        params: expect.objectContaining({ status: "completed" }),
      }),
    );
  });
});
