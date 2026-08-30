"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";

import { useDigitalMenuAccess } from "@/components/dashboard/menu/DigitalMenuPicker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { useDashboardPageLabel } from "@/contexts/dashboard-page-label";
import { invalidateBranches, useBranch, useBranches } from "@/hooks/use-branches";
import { ApiError } from "@/lib/api";
import {
  applyBranchPhotoToAllBranchesRequest,
  applyBranchPhotoToAllMenusRequest,
  canCreateMenuOnBranch,
  deleteBranchPhotoRequest,
  deleteBranchRequest,
  updateBranchRequest,
  uploadBranchPhotoRequest,
} from "@/lib/branch";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SOFT_CARD_CLASS =
  "rounded-2xl border border-[#e5e7eb] bg-white shadow-none dark:border-border dark:bg-card";

type BranchSettingsViewProps = {
  branchId: number;
};

type SettingsSectionProps = {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  tone?: "default" | "danger";
};

function SettingsSection({
  title,
  description,
  open,
  onOpenChange,
  children,
  tone = "default",
}: SettingsSectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div
        className={cn(
          SOFT_CARD_CLASS,
          tone === "danger" && "border-destructive/25",
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-3 p-5 text-left sm:p-6"
          >
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              {description ? (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <ChevronDown
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t border-[#e5e7eb] px-5 pb-5 pt-4 dark:border-border sm:px-6 sm:pb-6">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function BranchSettingsView({ branchId }: BranchSettingsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchQuery = useBranch(branchId, canUseDigitalMenu);
  const branchesQuery = useBranches(canUseDigitalMenu);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [hydratedFor, setHydratedFor] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState<"branches" | "menus" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [menusOpen, setMenusOpen] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const branch = branchQuery.data ?? null;
  useDashboardPageLabel(branch?.name);
  const menus = branch?.menus ?? [];
  const hasMenus = menus.length > 0;
  const canAddMenu = branch
    ? canCreateMenuOnBranch(branch, branchesQuery.data?.menuQuota)
    : false;

  useEffect(() => {
    if (!branch || hydratedFor === branch.id) return;
    setName(branch.name ?? "");
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setEmail(branch.email ?? "");
    setHydratedFor(branch.id);
    setMenusOpen(branch.menus.length > 0);
  }, [branch, hydratedFor]);

  useEffect(() => {
    if (branchQuery.isError) {
      notify("danger", branchQuery.error instanceof ApiError ? branchQuery.error.message : "Şube yüklenemedi.");
      router.push(DASHBOARD_ROUTES.digitalMenu);
    }
  }, [branchQuery.error, branchQuery.isError, notify, router]);

  const save = async () => {
    if (!name.trim()) {
      notify("warning", "Şube adı zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await updateBranchRequest(branchId, {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      await invalidateBranches(queryClient);
      notify("info", "Şube bilgileri güncellendi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Şube güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      notify("warning", "Desteklenen formatlar: JPEG, PNG, WebP");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      notify("warning", "Fotoğraf boyutu en fazla 5 MB olabilir.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setUploading(true);
    try {
      await uploadBranchPhotoRequest(branchId, file);
      await invalidateBranches(queryClient);
      notify("info", "Şube fotoğrafı güncellendi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fotoğraf yüklenemedi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setUploading(true);
    try {
      await deleteBranchPhotoRequest(branchId);
      await invalidateBranches(queryClient);
      notify("info", "Şube fotoğrafı silindi.");
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fotoğraf silinemedi.");
    } finally {
      setUploading(false);
    }
  };

  const applyPhoto = async (target: "branches" | "menus") => {
    setApplying(target);
    try {
      if (target === "branches") {
        await applyBranchPhotoToAllBranchesRequest(branchId);
        notify("info", "Fotoğraf tüm şubelere uygulandı.");
      } else {
        await applyBranchPhotoToAllMenusRequest(branchId);
        notify("info", "Fotoğraf tüm menülere uygulandı.");
      }
      await invalidateBranches(queryClient);
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Fotoğraf uygulanamadı.");
    } finally {
      setApplying(null);
    }
  };

  const removeBranch = async () => {
    setDeleting(true);
    try {
      await deleteBranchRequest(branchId);
      await invalidateBranches(queryClient);
      notify("info", "Şube silindi.");
      router.push(DASHBOARD_ROUTES.digitalMenu);
    } catch (error) {
      notify("danger", error instanceof ApiError ? error.message : "Şube silinemedi.");
    } finally {
      setDeleting(false);
    }
  };

  if (accessLoading || branchQuery.isLoading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!canUseDigitalMenu) {
    return <p className="text-sm text-muted-foreground">Şube ayarları için aktif paket gerekir.</p>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-muted-foreground hover:bg-muted/50 dark:border-border dark:bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Şube ayarları</h1>
          <p className="text-sm text-muted-foreground">{branch?.name ?? "Şube bilgileri"}</p>
        </div>
      </div>

      <SettingsSection
        title="Şube bilgileri"
        description="Ad, adres ve iletişim bilgileri"
        open={infoOpen}
        onOpenChange={setInfoOpen}
      >
        <div className="space-y-2">
          <Label htmlFor="branch-name">Şube adı</Label>
          <Input id="branch-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-address">Adres</Label>
          <Input id="branch-address" value={address} onChange={(event) => setAddress(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-phone">Telefon</Label>
          <Input id="branch-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-email">E-posta</Label>
          <Input id="branch-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="flex justify-end pt-1">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Şube fotoğrafı"
        description="JPEG, PNG veya WebP · en fazla 5 MB"
        open={photoOpen}
        onOpenChange={setPhotoOpen}
      >
        {branch?.photoUrl ? (
          <img
            src={branch.photoUrl}
            alt={branch.name}
            className="h-28 w-28 rounded-xl border border-[#e5e7eb] object-cover dark:border-border"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] text-muted-foreground dark:border-border dark:bg-background">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => void handlePhoto(event)}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fotoğraf yükle"}
          </Button>
          {branch?.photoUrl ? (
            <Button variant="outline" disabled={uploading} onClick={() => void removePhoto()}>
              Fotoğrafı sil
            </Button>
          ) : null}
          <Button
            variant="outline"
            disabled={!branch?.photoUrl || applying != null}
            onClick={() => void applyPhoto("branches")}
          >
            {applying === "branches" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tüm şubelere uygula"}
          </Button>
          <Button
            variant="outline"
            disabled={!branch?.photoUrl || applying != null}
            onClick={() => void applyPhoto("menus")}
          >
            {applying === "menus" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tüm menülere uygula"}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Menüler"
        description={
          hasMenus
            ? `${menus.length} menü · bu şubeye bağlı dijital menüler`
            : "Bu şubede henüz menü yok · ilk menü ücretsiz"
        }
        open={menusOpen}
        onOpenChange={setMenusOpen}
      >
        {hasMenus ? (
          <div className="space-y-2">
            {menus.map((menu) => (
              <Link
                key={menu.menuId}
                href={DASHBOARD_ROUTES.digitalMenuEdit(menu.qrId)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-3 py-2.5 transition-colors hover:bg-muted/60 dark:border-border dark:bg-background"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{menu.businessName}</p>
                  {!menu.active ? (
                    <p className="text-xs text-muted-foreground">Yayında değil</p>
                  ) : null}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Henüz menü oluşturulmadı.</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(
              canAddMenu
                ? DASHBOARD_ROUTES.digitalMenuCreateForBranch(branchId)
                : DASHBOARD_ROUTES.catalogProductCheckout("QR_MENU"),
            )
          }
        >
          {canAddMenu ? "Menü oluştur" : "Ek menü satın al"}
        </Button>
      </SettingsSection>

      <SettingsSection
        title="Şubeyi sil"
        description={
          hasMenus
            ? "Önce bu şubeye bağlı menüleri silmeniz gerekir"
            : "Şube soft delete ile kaldırılır"
        }
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tone="danger"
      >
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2" disabled={deleting || hasMenus}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Şubeyi sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Şube silinsin mi?</AlertDialogTitle>
                <AlertDialogDescription>
                  <span className="font-medium">{branch?.name ?? "Bu şube"}</span> kaldırılır.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={() => void removeBranch()}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsSection>
    </div>
  );
}
