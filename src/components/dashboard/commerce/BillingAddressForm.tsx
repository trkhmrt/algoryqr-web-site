"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { billingAddressSchema, type BillingAddressForm as BillingAddressFormValues } from "@/lib/commerce";

const DEFAULT_VALUES: BillingAddressFormValues = {
  type: "INDIVIDUAL",
  title: "",
  name: "",
  surname: "",
  legalName: "",
  tckn: "",
  vkn: "",
  taxOffice: "",
  mersis: "",
  country: "Türkiye",
  city: "",
  district: "",
  address: "",
  postcode: "",
  email: "",
  phone: "",
  defaultAddress: true,
};

interface BillingAddressFormProps {
  submitting?: boolean;
  submitLabel?: string;
  initialValues?: Partial<BillingAddressFormValues>;
  onSubmit: (values: BillingAddressFormValues) => Promise<void>;
}

export default function BillingAddressForm({
  submitting = false,
  submitLabel = "Adresi Kaydet",
  initialValues,
  onSubmit,
}: BillingAddressFormProps) {
  const form = useForm<BillingAddressFormValues>({
    resolver: zodResolver(billingAddressSchema),
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  });
  const type = form.watch("type");

  const field = (
    name: keyof BillingAddressFormValues,
    label: string,
    placeholder?: string,
  ) => {
    const error = form.formState.errors[name]?.message;
    return (
      <div className="space-y-2">
        <Label htmlFor={`billing-${name}`}>{label}</Label>
        <Input id={`billing-${name}`} placeholder={placeholder} {...form.register(name)} />
        {error && <p className="text-xs text-destructive">{String(error)}</p>}
      </div>
    );
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Adres tipi (zorunlu)</Label>
        <Select
          value={type}
          onValueChange={(value) => form.setValue("type", value as BillingAddressFormValues["type"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INDIVIDUAL">Bireysel</SelectItem>
            <SelectItem value="CORPORATE">Kurumsal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {field("title", "Adres adı (zorunlu)", "Örn. Ev, Ofis")}

      <div className="grid gap-4 sm:grid-cols-2">
        {type === "INDIVIDUAL" ? (
          <>
            {field("name", "Ad (zorunlu)")}
            {field("surname", "Soyad (zorunlu)")}
            {field("tckn", "TCKN (opsiyonel)")}
          </>
        ) : (
          <>
            {field("legalName", "Ticari unvan (zorunlu)")}
            {field("vkn", "VKN (zorunlu)")}
            {field("taxOffice", "Vergi dairesi (zorunlu)")}
            {field("mersis", "MERSİS (opsiyonel)")}
          </>
        )}
        {field("email", "E-posta (zorunlu)")}
        {field("phone", "Telefon (zorunlu)")}
        {field("city", "Şehir (zorunlu)")}
        {field("district", "İlçe (zorunlu)")}
        {field("country", "Ülke (zorunlu)")}
        {field("postcode", "Posta kodu (zorunlu)")}
      </div>
      {field("address", "Açık adres (zorunlu)")}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.watch("defaultAddress")}
          onCheckedChange={(checked) => form.setValue("defaultAddress", checked === true)}
        />
        Varsayılan adres olarak kaydet (opsiyonel)
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || form.formState.isSubmitting} className="gap-2">
          {(submitting || form.formState.isSubmitting) && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
