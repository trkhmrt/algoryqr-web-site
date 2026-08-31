import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { MainCategoryApiItem } from "@/lib/api";

const UPLOAD_TIMEOUT_MS = 60_000;

export async function uploadCategoryCover(
  menuId: number,
  categoryId: number,
  file: File,
): Promise<MainCategoryApiItem> {
  const form = new FormData();
  form.append("file", file);

  try {
    const response = await api.post<MainCategoryApiItem>(
      `/menu/${menuId}/categories/${categoryId}/cover`,
      form,
      {
        headers: { "Content-Type": undefined },
        timeout: UPLOAD_TIMEOUT_MS,
      },
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || "Kapak görseli yüklenemedi");
    }
    throw error;
  }
}

export async function deleteCategoryCover(
  menuId: number,
  categoryId: number,
): Promise<MainCategoryApiItem> {
  try {
    const response = await api.delete<MainCategoryApiItem>(
      `/menu/${menuId}/categories/${categoryId}/cover`,
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || "Kapak görseli silinemedi");
    }
    throw error;
  }
}
