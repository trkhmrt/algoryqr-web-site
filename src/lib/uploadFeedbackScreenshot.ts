import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export type FeedbackScreenshotUploadResponse = {
  imageUrl: string;
  objectKey: string;
};

const UPLOAD_TIMEOUT_MS = 60_000;

export async function uploadFeedbackScreenshot(
  file: File,
): Promise<FeedbackScreenshotUploadResponse> {
  const form = new FormData();
  form.append("file", file);

  try {
    const response = await api.post<FeedbackScreenshotUploadResponse>(
      "/platform-feedback/screenshot",
      form,
      {
        headers: { "Content-Type": undefined },
        timeout: UPLOAD_TIMEOUT_MS,
      },
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || "Ekran görüntüsü yüklenemedi");
    }
    throw error;
  }
}
