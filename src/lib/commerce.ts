import { z } from "zod";

export type PaymentStyle = "SUBSCRIPTION";
export type BillingPeriod = "MONTHLY" | "YEARLY";
export type BillingAddressType = "INDIVIDUAL" | "CORPORATE";

export interface BillingAddress {
  id: number;
  type: BillingAddressType;
  title?: string | null;
  name?: string | null;
  surname?: string | null;
  legalName?: string | null;
  tckn?: string | null;
  vkn?: string | null;
  taxOffice?: string | null;
  mersis?: string | null;
  country: string;
  city: string;
  district: string;
  address: string;
  postcode: string;
  email: string;
  phone: string;
  taxpayerInvoice?: boolean;
  defaultAddress?: boolean;
}

export interface PaymentMethod {
  id: string;
  cardAlias?: string | null;
  brand?: string | null;
  lastFour: string;
  expiryMonth?: number | null;
  expiryYear?: number | null;
}

export interface BinInstallmentOption {
  installmentCount: number;
  monthlyAmount?: number | string | null;
  totalAmount?: number | string | null;
}

export interface DigitalMenuTrialStatus {
  status: "NOT_STARTED" | "ACTIVE" | "TRIAL_EXPIRED" | "PURCHASED" | string;
  trialEndsAt?: string | null;
  daysRemaining?: number | null;
  packageId?: number | null;
  packageName?: string | null;
  price?: number | string | null;
  currency?: string | null;
  purchaseId?: number | null;
}

const requiredText = (message: string) => z.string().trim().min(1, message);

export const DEFAULT_IDENTITY_NUMBER = "11111111111";

export const billingAddressSchema = z.object({
  type: z.enum(["INDIVIDUAL", "CORPORATE"]),
  title: z.string().trim().min(1, "Adres adı zorunludur").max(80, "Adres adı en fazla 80 karakter olabilir"),
  name: z.string().trim().optional(),
  surname: z.string().trim().optional(),
  legalName: z.string().trim().optional(),
  tckn: z.string().trim().optional(),
  vkn: z.string().trim().optional(),
  taxOffice: z.string().trim().optional(),
  mersis: z.string().trim().optional(),
  country: requiredText("Ülke zorunludur"),
  city: requiredText("Şehir zorunludur"),
  district: requiredText("İlçe zorunludur"),
  address: z.string().trim().min(5, "Adres en az 5 karakter olmalıdır"),
  postcode: z.string().trim().min(3, "Posta kodu zorunludur"),
  email: z.string().trim().email("Geçerli e-posta girin"),
  phone: requiredText("Telefon zorunludur"),
  defaultAddress: z.boolean(),
}).superRefine((value, context) => {
  if (value.type === "INDIVIDUAL") {
    if (!value.name?.trim()) context.addIssue({ code: "custom", path: ["name"], message: "Ad zorunludur" });
    if (!value.surname?.trim()) context.addIssue({ code: "custom", path: ["surname"], message: "Soyad zorunludur" });
    const tckn = value.tckn?.trim() ?? "";
    if (tckn.length > 0 && !/^\d{11}$/.test(tckn)) {
      context.addIssue({ code: "custom", path: ["tckn"], message: "TCKN 11 haneli olmalıdır" });
    }
  }
  if (value.type === "CORPORATE") {
    if (!value.legalName?.trim()) context.addIssue({ code: "custom", path: ["legalName"], message: "Unvan zorunludur" });
    if (!/^\d{10}$/.test(value.vkn ?? "")) context.addIssue({ code: "custom", path: ["vkn"], message: "VKN 10 haneli olmalıdır" });
    if (!value.taxOffice?.trim()) context.addIssue({ code: "custom", path: ["taxOffice"], message: "Vergi dairesi zorunludur" });
  }
});

export type BillingAddressForm = z.infer<typeof billingAddressSchema>;

function optionalText(value: string | undefined | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveIdentityNumber(tckn?: string | null, vkn?: string | null): string {
  return optionalText(tckn) ?? optionalText(vkn) ?? DEFAULT_IDENTITY_NUMBER;
}

export function buildBillingAddressPayload(values: BillingAddressForm) {
  return {
    type: values.type,
    title: values.title.trim(),
    name: optionalText(values.name),
    surname: optionalText(values.surname),
    legalName: optionalText(values.legalName),
    taxOffice: optionalText(values.taxOffice),
    mersis: optionalText(values.mersis),
    tckn: values.type === "INDIVIDUAL" ? resolveIdentityNumber(values.tckn) : null,
    vkn: values.type === "CORPORATE" ? optionalText(values.vkn) : null,
    country: values.country.trim(),
    city: values.city.trim(),
    district: values.district.trim(),
    address: values.address.trim(),
    postcode: values.postcode.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    taxpayerInvoice: false,
    defaultAddress: values.defaultAddress,
  };
}

export const cardSchema = z.object({
  cardHolderName: requiredText("Kart üzerindeki isim zorunludur"),
  cardNumber: z.string().transform((value) => value.replace(/\D/g, "")).pipe(
    z.string().min(15, "Kart numarası en az 15 haneli olmalıdır").max(19, "Kart numarası en fazla 19 haneli olmalıdır"),
  ),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Son kullanma tarihi AA/YY formatında olmalıdır"),
  cvc: z.string().regex(/^\d{3,4}$/, "CVV 3 veya 4 haneli olmalıdır"),
  saveCard: z.boolean(),
});

export type CardForm = z.infer<typeof cardSchema>;

export const savedCardSchema = z.object({
  alias: z.string().max(255).optional(),
  cardHolderName: requiredText("Kart üzerindeki isim zorunludur"),
  cardNumber: z.string().transform((value) => value.replace(/\D/g, "")).pipe(
    z.string().min(15, "Kart numarası en az 15 haneli olmalıdır").max(19, "Kart numarası en fazla 19 haneli olmalıdır"),
  ),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Son kullanma tarihi AA/YY formatında olmalıdır"),
});

export type SavedCardForm = z.infer<typeof savedCardSchema>;

export const checkoutSchema = z.object({
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]),
  billingAddressId: z.number().int().positive("Fatura adresi seçin"),
  paymentMethodId: z.string().nullable(),
  recurringConsent: z.boolean(),
}).superRefine((value, context) => {
  if (!value.recurringConsent) {
    context.addIssue({ code: "custom", path: ["recurringConsent"], message: "Düzenli ödeme onayı zorunludur" });
  }
});

export function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function getBin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function mapTrialStatus(payload: {
  lifecycle?: string;
  expiresAt?: string | null;
  purchaseId?: number | null;
  packageId?: number | null;
  packageCode?: string | null;
  packageName?: string | null;
  daysUntilExpiry?: number | null;
  price?: number | string | null;
  currency?: string | null;
}): DigitalMenuTrialStatus {
  const lifecycle = payload.lifecycle ?? "AVAILABLE";
  const status =
    lifecycle === "ACTIVE" ? "ACTIVE"
      : lifecycle === "TRIAL_EXPIRED" ? "TRIAL_EXPIRED"
        : "NOT_STARTED";
  return {
    status,
    trialEndsAt: payload.expiresAt ?? null,
    daysRemaining: typeof payload.daysUntilExpiry === "number" ? payload.daysUntilExpiry : null,
    packageId: payload.packageId ?? null,
    packageName: payload.packageName ?? null,
    price: payload.price ?? null,
    currency: payload.currency ?? null,
    purchaseId: payload.purchaseId ?? null,
  };
}

export function calculateTrialDaysRemaining(status: DigitalMenuTrialStatus, now = new Date()): number | null {
  if (typeof status.daysRemaining === "number") return Math.max(0, Math.ceil(status.daysRemaining));
  if (!status.trialEndsAt) return null;
  const endsAt = new Date(status.trialEndsAt).getTime();
  if (Number.isNaN(endsAt)) return null;
  return Math.max(0, Math.ceil((endsAt - now.getTime()) / 86_400_000));
}

export function displayBillingName(address: BillingAddress): string {
  if (address.title?.trim()) return address.title.trim();
  if (address.type === "CORPORATE") return address.legalName || "Kurumsal adres";
  return [address.name, address.surname].filter(Boolean).join(" ") || "Bireysel adres";
}
