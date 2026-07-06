import type { PlanPackageApiItem } from "@/lib/api";

export interface PackagePaymentCardInput {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface PackagePaymentBuyerInput {
  userId: number | string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  ip: string;
}

export interface PaymentServiceCreateRequest {
  conversationId: string;
  locale: string;
  price: number;
  paidPrice: number;
  currency: string;
  installment: number;
  basketId: string;
  paymentChannel: string;
  paymentGroup: string;
  callbackUrl?: string;
  paymentCard: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
    registerCard: number;
  };
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
    zipCode: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
    zipCode: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    category2: string;
    itemType: string;
    price: number;
  }>;
}

function parseExpiry(expiry: string): { month: string; year: string } {
  const [mm, yy] = expiry.split("/");
  const month = (mm ?? "").padStart(2, "0");
  const yearRaw = (yy ?? "").trim();
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return { month, year };
}

function toAmount(value: number | string): number {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(amount) ? amount : 0;
}

export function isFreePackage(pkg: PlanPackageApiItem): boolean {
  return toAmount(pkg.price) <= 0;
}

export function buildPackagePaymentRequest(params: {
  pkg: PlanPackageApiItem;
  card: PackagePaymentCardInput;
  buyer: PackagePaymentBuyerInput;
  conversationId: string;
  callbackUrl?: string;
}): PaymentServiceCreateRequest {
  const { pkg, card, buyer, conversationId, callbackUrl } = params;
  const price = toAmount(pkg.price);
  const paidPrice = price;
  const { month, year } = parseExpiry(card.expiry);
  const cardDigits = card.cardNumber.replace(/\s/g, "");
  const fullName = `${buyer.firstName} ${buyer.lastName}`.trim() || card.cardholderName;
  const address = "Türkiye";
  const currency = pkg.currency === "USD" ? "USD" : "TRY";

  return {
    conversationId,
    locale: "tr",
    price,
    paidPrice,
    currency,
    installment: 1,
    basketId: `pkg-${pkg.id}`,
    paymentChannel: "WEB",
    paymentGroup: "PRODUCT",
    callbackUrl,
    paymentCard: {
      cardHolderName: card.cardholderName.trim(),
      cardNumber: cardDigits,
      expireMonth: month,
      expireYear: year,
      cvc: card.cvv,
      registerCard: 0,
    },
    buyer: {
      id: String(buyer.userId),
      name: buyer.firstName || "Müşteri",
      surname: buyer.lastName || "Kullanıcı",
      gsmNumber: buyer.phoneNumber?.trim() || "+905350000000",
      email: buyer.email,
      identityNumber: "11111111111",
      registrationAddress: address,
      ip: buyer.ip,
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: fullName,
      city: "Istanbul",
      country: "Turkey",
      address,
      zipCode: "34000",
    },
    billingAddress: {
      contactName: fullName,
      city: "Istanbul",
      country: "Turkey",
      address,
      zipCode: "34000",
    },
    basketItems: [
      {
        id: `pkg-item-${pkg.id}`,
        name: pkg.name,
        category1: "Abonelik",
        category2: "QR Paket",
        itemType: "VIRTUAL",
        price,
      },
    ],
  };
}

export function createPackageConversationId(packageId: number, userId: number | string): string {
  return `algoryqr-pkg-${packageId}-u${userId}-${Date.now()}`;
}

/** 3DS callback'te conversationId'den paket ve kullanıcı bilgisi çıkarılır. */
export function parsePackageConversationId(
  conversationId: string,
): { packageId: number; userId: string } | null {
  const match = /^algoryqr-pkg-(\d+)-u([^-]+)-(\d+)$/.exec(conversationId.trim());
  if (!match) return null;
  const packageId = Number(match[1]);
  if (!Number.isFinite(packageId)) return null;
  return { packageId, userId: match[2] };
}
