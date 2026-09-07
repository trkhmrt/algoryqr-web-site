"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import {
  ApiError,
  createPublicReservationRequest,
  type MenuReservationCreateBody,
} from "@/lib/api";

type ReservationFormProps = {
  publicId: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
};

function toReservationAt(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function ReservationForm({
  publicId,
  className,
  inputClassName,
  buttonClassName,
}: ReservationFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fieldClass =
    inputClassName ??
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    if (!customerName.trim()) {
      setError("Ad soyad zorunludur");
      return;
    }
    if (!trimmedPhone && !trimmedEmail) {
      setError("Telefon veya e-posta zorunludur");
      return;
    }
    if (!date || !time) {
      setError("Tarih ve saat zorunludur");
      return;
    }
    const size = Number(partySize);
    if (!Number.isFinite(size) || size < 1 || size > 50) {
      setError("Kişi sayısı 1 ile 50 arasında olmalıdır");
      return;
    }

    const payload: MenuReservationCreateBody = {
      customerName: customerName.trim(),
      phone: trimmedPhone || undefined,
      email: trimmedEmail || undefined,
      partySize: size,
      reservationAt: toReservationAt(date, time),
      note: note.trim() || undefined,
    };

    setSubmitting(true);
    try {
      await createPublicReservationRequest(publicId, payload);
      setSuccess(true);
      setCustomerName("");
      setPhone("");
      setEmail("");
      setPartySize("2");
      setDate("");
      setTime("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rezervasyon oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={className ?? "space-y-3 px-4 py-4"}>
      <div>
        <h2 className="font-display text-2xl font-semibold text-gradient-gold">Rezervasyon</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Talebiniz onay bekliyor olarak iletilir. Telefon veya e-posta zorunludur.
        </p>
      </div>

      <label className="block space-y-1 text-xs">
        <span>Ad soyad</span>
        <input
          className={fieldClass}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value.slice(0, 120))}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-xs">
          <span>Tarih</span>
          <input
            type="date"
            className={fieldClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1 text-xs">
          <span>Saat</span>
          <input
            type="time"
            className={fieldClass}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>
      </div>

      <label className="block space-y-1 text-xs">
        <span>Kişi sayısı</span>
        <input
          type="number"
          min={1}
          max={50}
          className={fieldClass}
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
          required
        />
      </label>

      <label className="block space-y-1 text-xs">
        <span>Telefon</span>
        <input
          type="tel"
          className={fieldClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value.slice(0, 40))}
          placeholder="Telefon veya e-posta"
        />
      </label>

      <label className="block space-y-1 text-xs">
        <span>E-posta</span>
        <input
          type="email"
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, 255))}
          placeholder="Telefon veya e-posta"
        />
      </label>

      <label className="block space-y-1 text-xs">
        <span>Not (isteğe bağlı)</span>
        <textarea
          className={fieldClass}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
        />
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-600">
          Rezervasyon talebiniz alındı. Onay sonrası aktif olacaktır.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className={
          buttonClassName ??
          "inline-flex h-10 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
        }
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rezervasyon Gönder"}
      </button>
    </form>
  );
}
