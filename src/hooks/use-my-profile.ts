"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const MY_PROFILE_QUERY_KEY = ["myProfile"] as const;

export interface MyProfile {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  twoFactorEnabled: boolean;
  memberSince: string | null;
  notifyEmailImportant: boolean;
  notifyScanAlerts: boolean;
  notifyWeeklyReport: boolean;
  notifyMarketingEmails: boolean;
  notifyPushBrowser: boolean;
}

export type MyProfilePatch = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  notifyEmailImportant: boolean;
  notifyScanAlerts: boolean;
  notifyWeeklyReport: boolean;
  notifyMarketingEmails: boolean;
  notifyPushBrowser: boolean;
}>;

/**
 * Profil, cookie'deki access JWT ile /api üzerinden çekilir; localStorage'da `id` olmasını bekleme.
 * (Dashboard zaten cookie yoksa yönlendirir.)
 */
export function useMyProfile() {
  return useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get<MyProfile>("/api/account/myprofile", { withCredentials: true });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function invalidateMyProfile(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY, exact: false });
}
