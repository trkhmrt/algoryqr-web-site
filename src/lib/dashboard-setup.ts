import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

export type SetupStepId = "card" | "branch" | "menu" | "publish";

export type SetupStep = {
  id: SetupStepId;
  label: string;
  hint: string;
  href: string;
  done: boolean;
};

export type SetupStats = {
  hasCard: boolean;
  canOperate: boolean;
  branchCount: number;
  totalMenus: number;
  liveMenus: number;
};

export function buildSetupSteps(stats: SetupStats): SetupStep[] {
  return [
    {
      id: "card",
      label: "Kart ekle",
      hint: "Deneme bitince bu karttan çekilir",
      href: DASHBOARD_ROUTES.trialStart,
      done: stats.hasCard && stats.canOperate,
    },
    {
      id: "branch",
      label: "Şube oluştur",
      hint: "İşletmenizin lokasyonunu ekleyin",
      href: DASHBOARD_ROUTES.branchCreate,
      done: stats.branchCount > 0,
    },
    {
      id: "menu",
      label: "Menü oluştur",
      hint: "Şubeye dijital menü bağlayın",
      href: DASHBOARD_ROUTES.digitalMenuCreate,
      done: stats.totalMenus > 0,
    },
    {
      id: "publish",
      label: "QR yayınla",
      hint: "Menüyü yayına alıp masaya koyun",
      href: stats.totalMenus > 0 ? DASHBOARD_ROUTES.digitalMenuMenus : DASHBOARD_ROUTES.digitalMenuCreate,
      done: stats.liveMenus > 0,
    },
  ];
}

export function nextSetupStep(steps: SetupStep[]): SetupStep | null {
  return steps.find((step) => !step.done) ?? null;
}

export function isSetupComplete(steps: SetupStep[]): boolean {
  return steps.every((step) => step.done);
}
