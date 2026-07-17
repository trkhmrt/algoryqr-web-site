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
  taxpayerInvoice: false,
  defaultAddress: true,
};

interface BillingAddressFormProps {
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: BillingAddressFormValues) => Promise<void>;
}

export default function BillingAddressForm({
  submitting = false,
  submitLabel = "Adresi Kaydet",
  onSubmit,
}: BillingAddressFormProps) {
  const form = useForm<BillingAddressFormValues>({
    resolver: zodResolver(billingAddressSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const type = form.watch("type");
  const taxpayerInvoice = form.watch("taxpayerInvoice");

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
        <Label>Adres tipi</Label>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {type === "INDIVIDUAL" ? (
          <>
            {field("name", "Ad")}
            {field("surname", "Soyad")}
            {taxpayerInvoice && field("tckn", "TCKN")}
          </>
        ) : (
          <>
            {field("legalName", "Ticari unvan")}
            {field("vkn", "VKN")}
            {field("taxOffice", "Vergi dairesi")}
            {field("mersis", "MERSİS (isteğe bağlı)")}
          </>
        )}
        {field("email", "E-posta")}
        {field("phone", "Telefon")}
        {field("city", "Şehir")}
        {field("district", "İlçe")}
        {field("country", "Ülke")}
        {field("postcode", "Posta kodu")}
      </div>
      {field("address", "Açık adres")}

      {type === "INDIVIDUAL" && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={taxpayerInvoice}
            onCheckedChange={(checked) => form.setValue("taxpayerInvoice", checked === true)}
          />
          Vergi mükellefi faturası istiyorum
        </label>
      )}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.watch("defaultAddress")}
          onCheckedChange={(checked) => form.setValue("defaultAddress", checked === true)}
        />
        Varsayılan adres olarak kaydet
      </label>

      <Button type="submit" disabled={submitting || form.formState.isSubmitting} className="gap-2">
        {(submitting || form.formState.isSubmitting) && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
