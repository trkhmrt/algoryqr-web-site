export type ReportingMethodId = string;

export type ReportingUnit = "money" | "count" | "ratio" | "percent";

export type ReportingMethodDef<Id extends ReportingMethodId = ReportingMethodId> = {
  id: Id;
  /** Ekranda görünen etiket */
  label: string;
  /** Hesabı üreten fonksiyon adı */
  method: string;
  /** Kısa formül */
  formula: string;
  /** Hangi kayıtlara uygulandığı */
  filter: string;
  unit: ReportingUnit;
};

export type ReportingKpiCard<Id extends ReportingMethodId = ReportingMethodId> = ReportingMethodDef<Id> & {
  value: number;
  display: string;
};

export type AnalyticsPeriod = "yesterday" | "1d" | "7d" | "30d";
