import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { MenuProfileApiItem } from "@/lib/api";

const UPLOAD_TIMEOUT_MS = 60_000;

export async function uploadMenuLogo(
  menuId: number,
  file: File,
): Promise<MenuProfileApiItem> {
  const form = new FormData();
  form.append("file", file);

  try {
    const response = await api.post<MenuProfileApiItem>(`/menu/${menuId}/logo`, form, {
      headers: { "Content-Type": undefined },
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || "Logo yüklenemedi");
    }
    throw error;
  }
}

export async function deleteMenuLogo(menuId: number): Promise<MenuProfileApiItem> {
  try {
    const response = await api.delete<MenuProfileApiItem>(`/menu/${menuId}/logo`);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message || "Logo silinemedi");
    }
    throw error;
  }
}
