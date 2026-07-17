import { z } from "zod";

export type PaymentStyle = "ONE_TIME" | "BANK_INSTALLMENT" | "SUBSCRIPTION";
export type BillingAddressType = "INDIVIDUAL" | "CORPORATE";

export interface BillingAddress {
  id: number;
  type: BillingAddressType;
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

export const billingAddressSchema = z.object({
  type: z.enum(["INDIVIDUAL", "CORPORATE"]),
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
  taxpayerInvoice: z.boolean(),
  defaultAddress: z.boolean(),
}).superRefine((value, context) => {
  if (value.type === "INDIVIDUAL") {
    if (!value.name?.trim()) context.addIssue({ code: "custom", path: ["name"], message: "Ad zorunludur" });
    if (!value.surname?.trim()) context.addIssue({ code: "custom", path: ["surname"], message: "Soyad zorunludur" });
    if (value.taxpayerInvoice && !/^\d{11}$/.test(value.tckn ?? "")) {
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
  paymentStyle: z.enum(["ONE_TIME", "BANK_INSTALLMENT", "SUBSCRIPTION"]),
  billingAddressId: z.number().int().positive("Fatura adresi seçin"),
  paymentMethodId: z.string().nullable(),
  bankInstallmentCount: z.number().int().min(1),
  recurringConsent: z.boolean(),
}).superRefine((value, context) => {
  if (value.paymentStyle === "BANK_INSTALLMENT" && value.bankInstallmentCount < 2) {
    context.addIssue({ code: "custom", path: ["bankInstallmentCount"], message: "Taksit sayısı seçin" });
  }
  if (value.paymentStyle === "SUBSCRIPTION" && !value.recurringConsent) {
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
}): DigitalMenuTrialStatus {
  const lifecycle = payload.lifecycle ?? "AVAILABLE";
  const status =
    lifecycle === "ACTIVE" ? "ACTIVE"
      : lifecycle === "TRIAL_EXPIRED" ? "TRIAL_EXPIRED"
        : "NOT_STARTED";
  return {
    status,
    trialEndsAt: payload.expiresAt ?? null,
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
  if (address.type === "CORPORATE") return address.legalName || "Kurumsal adres";
  return [address.name, address.surname].filter(Boolean).join(" ") || "Bireysel adres";
}
