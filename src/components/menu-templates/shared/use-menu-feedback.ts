"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getPublicMenuRatingRequest,
  submitPublicMenuRatingRequest,
  submitPublicProductRatingRequest,
  type MenuProductApiItem,
} from "@/lib/api";

export function useMenuFeedback(menuId: number, initialAvg?: number | null, initialCount?: number) {
  const [menuRatingAvg, setMenuRatingAvg] = useState<number | null>(
    initialAvg != null && Number(initialAvg) > 0 ? Number(initialAvg) : null,
  );
  const [menuRatingCount, setMenuRatingCount] = useState<number>(initialCount ?? 0);
  const [menuUserRating, setMenuUserRating] = useState<number | null>(null);
  const [menuSubmitting, setMenuSubmitting] = useState(false);

  const [productRatingAvg, setProductRatingAvg] = useState<number | null>(null);
  const [productRatingCount, setProductRatingCount] = useState(0);
  const [productUserRating, setProductUserRating] = useState<number | null>(null);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void getPublicMenuRatingRequest(menuId)
      .then((data) => {
        if (!active) return;
        const avg = Number(data.ratingAvg);
        setMenuRatingAvg(Number.isFinite(avg) && avg > 0 ? avg : null);
        setMenuRatingCount(data.ratingCount ?? 0);
        setMenuUserRating(data.userRating ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [menuId]);

  const syncProductState = useCallback((product: MenuProductApiItem | null) => {
    if (!product) {
      setActiveProductId(null);
      setProductRatingAvg(null);
      setProductRatingCount(0);
      setProductUserRating(null);
      return;
    }
    setActiveProductId(product.productId);
    const avg = Number(product.ratingAvg);
    setProductRatingAvg(Number.isFinite(avg) && avg > 0 ? avg : null);
    setProductRatingCount(product.ratingCount ?? 0);
    setProductUserRating(null);
  }, []);

  const submitMenuFeedback = useCallback(
    async (score: number, comment?: string) => {
      if (menuSubmitting) return;
      setMenuSubmitting(true);
      try {
        const data = await submitPublicMenuRatingRequest(menuId, score, comment);
        const avg = Number(data.ratingAvg);
        setMenuRatingAvg(Number.isFinite(avg) && avg > 0 ? avg : null);
        setMenuRatingCount(data.ratingCount ?? menuRatingCount);
        setMenuUserRating(data.userRating ?? score);
      } catch {
        setMenuUserRating(score);
      } finally {
        setMenuSubmitting(false);
      }
    },
    [menuId, menuRatingCount, menuSubmitting],
  );

  const submitProductFeedback = useCallback(
    async (score: number, comment?: string) => {
      if (productSubmitting || activeProductId == null) return;
      setProductSubmitting(true);
      try {
        const data = await submitPublicProductRatingRequest(menuId, activeProductId, score, comment);
        const avg = Number(data.ratingAvg);
        setProductRatingAvg(Number.isFinite(avg) && avg > 0 ? avg : null);
        setProductRatingCount(data.ratingCount ?? productRatingCount);
        setProductUserRating(data.userRating ?? score);
      } catch {
        setProductUserRating(score);
      } finally {
        setProductSubmitting(false);
      }
    },
    [activeProductId, menuId, productRatingCount, productSubmitting],
  );

  return {
    menu: {
      ratingAvg: menuRatingAvg,
      ratingCount: menuRatingCount,
      userRating: menuUserRating,
      submitting: menuSubmitting,
      onSubmit: submitMenuFeedback,
    },
    product: {
      ratingAvg: productRatingAvg,
      ratingCount: productRatingCount,
      userRating: productUserRating,
      submitting: productSubmitting,
      onSubmit: submitProductFeedback,
    },
    syncProductState,
  };
}
