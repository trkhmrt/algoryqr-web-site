import { api } from "@/lib/api/client";

export type PublishTarget = "INTERNAL_MENU" | "UBEREATS";

export type IntegrationPendingProduct = {
  id: string;
  jobId: string;
  menuId: number;
  source: string;
  sourceProductId?: string | null;
  productData?: Record<string, unknown> | null;
  confidence?: number | null;
  approvalStatus: string;
  publishTargets?: string[] | null;
  warnings?: string[] | null;
  errorMessage?: string | null;
};

export type IntegrationPendingProductPage = {
  content: IntegrationPendingProduct[];
  totalElements: number;
  totalPages: number;
  number?: number;
  size?: number;
};

export type IntegrationJobAccepted = {
  jobId: string;
  status: string;
  direction: string;
};

export type UpdatePendingProductPayload = {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  subCategoryId?: number;
  imageUrl?: string;
  available?: boolean;
};

export async function importMenuFromUberEats(menuId: number) {
  const { data } = await api.post<IntegrationJobAccepted>(
    `/integrations/menus/${menuId}/import-from-ubereats`,
  );
  return data;
}

export async function exportMenuToUberEats(menuId: number) {
  const { data } = await api.post<IntegrationJobAccepted>(
    `/integrations/menus/${menuId}/export-to-ubereats`,
  );
  return data;
}

export function defaultPublishTargets(product: IntegrationPendingProduct): PublishTarget[] {
  if (product.source === "INTERNAL") {
    return ["UBEREATS"];
  }
  return ["INTERNAL_MENU"];
}

export async function listPendingProducts(
  menuId: number,
  options?: { status?: string; page?: number; size?: number },
) {
  const { data } = await api.get<IntegrationPendingProductPage>(
    `/integrations/pending-products/menus/${menuId}`,
    {
      params: {
        status: options?.status ?? "WAITING_APPROVAL",
        page: options?.page ?? 0,
        size: options?.size ?? 50,
      },
    },
  );
  return data;
}

export async function updatePendingProduct(
  menuId: number,
  id: string,
  payload: UpdatePendingProductPayload,
) {
  const { data } = await api.patch<IntegrationPendingProduct>(
    `/integrations/pending-products/menus/${menuId}/${id}`,
    payload,
  );
  return data;
}

export async function approvePendingProduct(
  menuId: number,
  id: string,
  publishTargets: PublishTarget[] = ["INTERNAL_MENU"],
) {
  const { data } = await api.post<IntegrationPendingProduct>(
    `/integrations/pending-products/menus/${menuId}/${id}/approve`,
    { publishTargets },
  );
  return data;
}

export async function rejectPendingProduct(menuId: number, id: string, reason: string) {
  await api.post(`/integrations/pending-products/menus/${menuId}/${id}/reject`, { reason });
}

export async function bulkApprovePendingProducts(
  menuId: number,
  productIds: string[],
  publishTargets: PublishTarget[] = ["INTERNAL_MENU"],
) {
  const { data } = await api.post<IntegrationPendingProduct[]>(
    `/integrations/pending-products/menus/${menuId}/bulk-approve`,
    { productIds, publishTargets },
  );
  return data;
}

export function productField(product: IntegrationPendingProduct, key: string): string {
  const value = product.productData?.[key];
  if (value == null) return "";
  return String(value);
}

export function productPrice(product: IntegrationPendingProduct): number | null {
  const raw = product.productData?.price;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
