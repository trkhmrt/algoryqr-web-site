"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardBanners } from "@/contexts/dashboard-banners";
import { invalidateBranches, useBranch } from "@/hooks/use-branches";
import { ApiError } from "@/lib/api";
import {
  applyBranchPhotoToAllBranchesRequest,
  applyBranchPhotoToAllMenusRequest,
  deleteBranchPhotoRequest,
  deleteBranchRequest,
  updateBranchRequest,
  uploadBranchPhotoRequest,
} from "@/lib/branch";
import { DASHBOARD_ROUTES } from "@/lib/dashboard-routes";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type BranchSettingsViewProps = {
  branchId: number;
};

export default function BranchSettingsView({ branchId }: BranchSettingsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notify } = useDashboardBanners();
  const { accessLoading, canUseDigitalMenu } = useDigitalMenuAccess();
  const branchQuery = useBranch(branchId, canUseDigitalMenu);
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

  const branch = branchQuery.data ?? null;

  useEffect(() => {
    if (!branch || hydratedFor === branch.id) return;
    setName(branch.name ?? "");
    setAddress(branch.address ?? "");
    setPhone(branch.phone ?? "");
    setEmail(branch.email ?? "");
    setHydratedFor(branch.id);
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

  const hasMenus = (branch?.menus ?? []).length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(DASHBOARD_ROUTES.digitalMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Şube ayarları</h1>
          <p className="text-sm text-muted-foreground">{branch?.name ?? "Şube bilgileri ve fotoğraf"}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
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
        <div className="flex justify-end">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium">Şube fotoğrafı</h2>
          <p className="text-xs text-muted-foreground">JPEG, PNG veya WebP. En fazla 5 MB.</p>
        </div>
        {branch?.photoUrl ? (
          <img src={branch.photoUrl} alt={branch.name} className="h-28 w-28 rounded-lg object-cover border border-border" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
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
      </div>

      <div className="rounded-lg border border-destructive/30 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Şubeyi sil</h2>
            <p className="text-xs text-muted-foreground">
              {hasMenus
                ? "Önce bu şubeye bağlı menüleri silmeniz gerekir."
                : "Şube soft delete ile kaldırılır."}
            </p>
          </div>
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
      </div>
    </div>
  );
}
