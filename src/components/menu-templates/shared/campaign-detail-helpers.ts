import type { ActiveCampaign } from "@/lib/public-campaign-api";

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatCampaignDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function campaignConditionLines(campaign: ActiveCampaign): string[] {
  const config = campaign.config ?? {};
  const lines: string[] = [];

  if (campaign.templateCode === "STAMP_CARD") {
    const required = asNumber(config.requiredQuantity);
    if (required != null && required > 0) {
      lines.push(`${required} kampanya ürünü tamamlandığında ödül kazanırsınız.`);
    }
  }

  if (campaign.templateCode === "SPEND_THRESHOLD") {
    const threshold = asNumber(config.thresholdAmount);
    const period =
      config.period === "MONTHLY"
        ? "ay"
        : config.period === "WEEKLY"
          ? "hafta"
          : null;
    if (threshold != null && threshold > 0) {
      lines.push(
        period
          ? `${period} içinde ${threshold} TL harcadığınızda ödül kazanırsınız.`
          : `${threshold} TL harcadığınızda ödül kazanırsınız.`,
      );
    }
  }

  lines.push("Kampanya hakları giriş yapan müşteriler için kaydedilir; misafir siparişlerde hak birikmez.");
  return lines;
}
