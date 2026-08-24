export const UBER_EATS_SYMBOL_SRC = "/uber-eats/symbol.png";
export const UBER_EATS_WORDMARK_SRC = "/uber-eats/wordmark.png";

type UberEatsSymbolProps = {
  className?: string;
};

export function UberEatsSymbol({ className }: UberEatsSymbolProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={UBER_EATS_SYMBOL_SRC} alt="" className={className} />
  );
}

type UberEatsWordmarkProps = {
  className?: string;
};

export function UberEatsWordmark({ className }: UberEatsWordmarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={UBER_EATS_WORDMARK_SRC} alt="Uber Eats" className={className} />
  );
}
