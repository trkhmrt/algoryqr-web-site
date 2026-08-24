import { UberEatsWordmarkSvg } from "@/components/icons/UberEatsWordmarkSvg";

type IntegrationsSectionHeaderProps = {
  pageTitle?: string;
  pageDescription?: string;
};

export function IntegrationsSectionHeader({
  pageTitle,
  pageDescription,
}: IntegrationsSectionHeaderProps) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          <UberEatsWordmarkSvg className="text-2xl sm:text-3xl" />
        </h1>
        <p className="text-sm text-muted-foreground">
          Trendyol Go Yemek hesabınızdaki ürünleri görün ve siparişleri takip edin.
        </p>
      </div>
      {pageTitle ? (
        <div className="space-y-1 pt-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{pageTitle}</h2>
          {pageDescription ? <p className="text-sm text-muted-foreground">{pageDescription}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
