"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  changeCustomerPassword,
  customerLogout,
  customerMe,
  joinCustomerMembership,
  updateCustomerProfile,
  type CustomerProfile,
} from "@/lib/customer-auth";

import { CustomerAuthDialog } from "./CustomerAuthDialog";
import { MenuLanguagePicker } from "./MenuLanguagePicker";
import { useMenuLocaleOptional } from "./menu-locale";
import { OrderHistoryPanel } from "./OrderHistoryPanel";

type Panel = "home" | "history" | "password";

type CustomerAccountMenuProps = {
  menuId: number;
  children?: ReactNode;
};

type AccountUiValue = {
  openAccount: () => void;
  openAuth: (mode: "login" | "register") => void;
  profile: CustomerProfile | null;
  registerInline: () => () => void;
};

const AccountUiContext = createContext<AccountUiValue | null>(null);

function AccountButton({
  profile,
  onOpen,
  className,
}: {
  profile: CustomerProfile | null;
  onOpen: () => void;
  className?: string;
}) {
  const locale = useMenuLocaleOptional();
  const t = locale?.t;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/95 text-sm font-semibold shadow-md backdrop-blur",
        className,
      )}
      aria-label={t?.account || "Hesabım"}
    >
      {profile ? initials(profile) : <UserRound className="h-4 w-4" />}
    </button>
  );
}

export function useCustomerAccountUi() {
  const ctx = useContext(AccountUiContext);
  const registerInline = ctx?.registerInline;

  useLayoutEffect(() => {
    if (!registerInline) return;
    return registerInline();
  }, [registerInline]);

  return ctx;
}

export function CustomerAccountTrigger({ className }: { className?: string }) {
  const ctx = useCustomerAccountUi();
  if (!ctx) return null;
  return <AccountButton profile={ctx.profile} onOpen={ctx.openAccount} className={className} />;
}

function initials(profile: CustomerProfile | null): string {
  if (!profile) return "";
  const a = (profile.firstName || "").trim().charAt(0);
  const b = (profile.lastName || "").trim().charAt(0);
  const out = `${a}${b}`.toUpperCase();
  if (out) return out;
  return (profile.email || "?").charAt(0).toUpperCase();
}

export function CustomerAccountMenu({ menuId, children }: CustomerAccountMenuProps) {
  const locale = useMenuLocaleOptional();
  const t = locale?.t;
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [inlineCount, setInlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>("home");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const me = await customerMe();
      setProfile(me);
      if (me) {
        setFirstName(me.firstName || "");
        setLastName(me.lastName || "");
        setPhone(me.phone || "");
        try {
          await joinCustomerMembership(menuId);
        } catch {
          /* ignore */
        }
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const openAccount = useCallback(() => {
    setOpen(true);
    setPanel("home");
    setMessage(null);
    setError(null);
  }, []);

  const openAuth = useCallback((mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const registerInline = useCallback(() => {
    setInlineCount((count) => count + 1);
    return () => setInlineCount((count) => Math.max(0, count - 1));
  }, []);

  const uiValue = useMemo<AccountUiValue>(
    () => ({
      openAccount,
      openAuth,
      profile,
      registerInline,
    }),
    [openAccount, openAuth, profile, registerInline],
  );

  return (
    <AccountUiContext.Provider value={uiValue}>
      {children}
      {inlineCount === 0 ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] mx-auto flex max-w-md justify-end px-3 pt-2.5">
          <AccountButton
            profile={profile}
            onOpen={openAccount}
            className="pointer-events-auto"
          />
        </div>
      ) : null}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-sm overflow-y-auto p-0 sm:max-w-sm"
          dir={locale?.dir}
        >
          <div className="space-y-4 px-4 py-5">
            <SheetHeader className="text-left">
              <SheetTitle>{t?.account || "Hesabım"}</SheetTitle>
              <SheetDescription>
                {profile?.email || t?.loginDescription || "Giriş yaparak sipariş geçmişinizi görüntüleyin."}
              </SheetDescription>
            </SheetHeader>

            <MenuLanguagePicker className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-card p-1" />

            {loading ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !profile ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthOpen(true);
                  }}
                  className="w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background"
                >
                  {t?.login || "Giriş yap"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthOpen(true);
                  }}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-medium"
                >
                  {t?.register || "Kayıt ol"}
                </button>
              </div>
            ) : panel === "history" ? (
              <OrderHistoryPanel menuId={menuId} onBack={() => setPanel("home")} />
            ) : panel === "password" ? (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError(null);
                  setMessage(null);
                  try {
                    await changeCustomerPassword({
                      currentPassword,
                      newPassword,
                      newPasswordConfirm,
                    });
                    setCurrentPassword("");
                    setNewPassword("");
                    setNewPasswordConfirm("");
                    setMessage("Şifre güncellendi.");
                    setPanel("home");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Şifre değiştirilemedi");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => setPanel("home")}
                  className="text-xs text-muted-foreground underline"
                >
                  Geri
                </button>
                <input
                  required
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifre"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifre"
                  minLength={6}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  required
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Yeni şifre tekrar"
                  minLength={6}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Şifreyi güncelle
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <form
                  className="space-y-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError(null);
                    setMessage(null);
                    try {
                      const updated = await updateCustomerProfile({
                        firstName,
                        lastName,
                        phone,
                      });
                      setProfile(updated);
                      setMessage("Profil kaydedildi.");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Profil güncellenemedi");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ad"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Soyad"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefon"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Profili kaydet
                  </button>
                </form>

                {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <button
                  type="button"
                  onClick={() => setPanel("history")}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
                >
                  {t?.orderHistory || "Sipariş geçmişi"}
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("password")}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
                >
                  {t?.changePassword || "Şifre değiştir"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await customerLogout();
                    setProfile(null);
                    setOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-muted/40"
                >
                  {t?.logout || "Çıkış yap"}
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CustomerAuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        menuId={menuId}
        initialMode={authMode}
        onSuccess={async () => {
          await loadProfile();
        }}
      />
    </AccountUiContext.Provider>
  );
}
