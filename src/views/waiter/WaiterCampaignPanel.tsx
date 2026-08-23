"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  grantWaiterCampaign,
  listWaiterActiveCampaigns,
  lookupWaiterCampaignCustomer,
  type WaiterActiveCampaign,
} from "@/lib/waiter-api";

export function WaiterCampaignPanel() {
  const [email, setEmail] = useState("");
  const [campaignId, setCampaignId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("1");
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"ADD_STAMPS" | "GRANT_REWARD" | "LINK_ORDER">("ADD_STAMPS");

  const campaignsQuery = useQuery({
    queryKey: ["waiter-campaigns-active"],
    queryFn: () => listWaiterActiveCampaigns(),
  });

  const selectedCampaign =
    campaignsQuery.data?.find((item) => item.id === campaignId) ?? null;
  const grantMenuId = selectedCampaign?.menuId ?? null;

  const lookupQuery = useQuery({
    queryKey: ["waiter-campaign-customer", grantMenuId, email],
    enabled: grantMenuId != null && email.includes("@"),
    queryFn: () => lookupWaiterCampaignCustomer(grantMenuId!, email),
    retry: false,
  });

  useEffect(() => {
    const first = campaignsQuery.data?.[0];
    if (first && campaignId === "") {
      setCampaignId(first.id);
    }
  }, [campaignId, campaignsQuery.data]);

  const grantMutation = useMutation({
    mutationFn: () =>
      grantWaiterCampaign(grantMenuId!, {
        email: email.trim(),
        campaignId: Number(campaignId),
        action,
        quantity: Number(quantity) || 1,
        orderId: orderId ? Number(orderId) : undefined,
        note: note.trim(),
      }),
  });

  const campaigns = campaignsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Aktif kampanyalar</h2>
        </div>
        {campaignsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yükleniyor…
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu şubede aktif kampanya yok.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((campaign: WaiterActiveCampaign) => (
              <li key={campaign.id} className="rounded-md border border-border/70 px-3 py-2">
                <p className="text-sm font-medium">{campaign.name}</p>
                {campaign.slogan ? (
                  <p className="text-xs text-muted-foreground">{campaign.slogan}</p>
                ) : null}
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {campaign.templateCode}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Kampanya Hak Tanımla</h2>

        <div className="space-y-1.5">
          <Label htmlFor="grant-email">Müşteri e-posta</Label>
          <Input
            id="grant-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="musteri@ornek.com"
          />
          {lookupQuery.data ? (
            <p className="text-xs text-muted-foreground">
              {lookupQuery.data.firstName} {lookupQuery.data.lastName ?? ""} ·{" "}
              {lookupQuery.data.member ? "Üye" : "Üye değil"}
            </p>
          ) : null}
          {lookupQuery.isError ? (
            <p className="text-xs text-destructive">Kayıtlı müşteri bulunamadı.</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grant-campaign">Kampanya</Label>
          <select
            id="grant-campaign"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={campaignId}
            onChange={(e) => setCampaignId(Number(e.target.value))}
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="grant-action">İşlem</Label>
          <select
            id="grant-action"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value as typeof action)}
          >
            <option value="ADD_STAMPS">Damga ekle</option>
            <option value="GRANT_REWARD">Ödül ver</option>
            <option value="LINK_ORDER">Siparişe bağla</option>
          </select>
        </div>

        {action === "ADD_STAMPS" ? (
          <div className="space-y-1.5">
            <Label htmlFor="grant-quantity">Damga adedi</Label>
            <Input
              id="grant-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        ) : null}

        {action === "LINK_ORDER" ? (
          <div className="space-y-1.5">
            <Label htmlFor="grant-order">Sipariş ID</Label>
            <Input
              id="grant-order"
              type="number"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="grant-note">Not (zorunlu)</Label>
          <Input
            id="grant-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="QR okutamadı, sistem hatası..."
          />
        </div>

        {grantMutation.isError ? (
          <p className="text-sm text-destructive">
            {grantMutation.error instanceof Error
              ? grantMutation.error.message
              : "Hak tanımlanamadı."}
          </p>
        ) : null}
        {grantMutation.isSuccess ? (
          <p className="text-sm text-emerald-600">{grantMutation.data.message}</p>
        ) : null}

        <Button
          className="w-full"
          disabled={
            grantMutation.isPending ||
            !email.trim() ||
            !note.trim() ||
            campaignId === "" ||
            grantMenuId == null
          }
          onClick={() => grantMutation.mutate()}
        >
          {grantMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hak Tanımla"}
        </Button>
      </section>
    </div>
  );
}
