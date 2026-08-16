"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { StoredUser } from "@/lib/api";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { useRouter } from "next/navigation";
import { useMyProfile } from "@/hooks/use-my-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

interface NavbarProps {
  initialUser?: StoredUser | null;
}

const navLinkClassName =
  "text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-70 dark:text-foreground";

function PanelLoginLink({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/login"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#e5e7eb] bg-background px-3.5 py-1.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-muted/50 sm:px-4 sm:py-2 dark:border-border dark:text-foreground",
        className,
      )}
    >
      Panele Giriş Yap
    </Link>
  );
}

function UserAvatarMenu({
  userInitials,
  onLogout,
  onNavigate,
}: {
  userInitials: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-9 w-9 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="Profil menusu"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNavigate("/dashboard/genel-bakis")}>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const Navbar = ({ initialUser = null }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(initialUser);
  const router = useRouter();
  const { data: profile } = useMyProfile(Boolean(user));
  const userFullName = useMemo(() => {
    const fromProfile = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
    if (fromProfile) return fromProfile;
    const fromUser = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    if (fromUser) return fromUser;
    return profile?.email || user?.email || "Kullanıcı";
  }, [profile, user]);
  const userInitials = useMemo(() => {
    const first = profile?.firstName?.[0] || user?.first_name?.[0] || "";
    const last = profile?.lastName?.[0] || user?.last_name?.[0] || "";
    const fromName = (first + last).toUpperCase();
    if (fromName) return fromName;
    const email = profile?.email || user?.email;
    return email?.[0]?.toUpperCase() || "?";
  }, [profile, user]);

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("algory_user");
    }
    await getSiteSameOriginAxios().post("/auth/logout", {}).catch(() => undefined);
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 max-w-6xl">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <BrandLogo priority />
          <span className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">
            Algory<span className="text-muted-foreground">QR</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="/#why-us" className={navLinkClassName}>
            Neden biz
          </a>
          <a href="/#pricing" className={navLinkClassName}>
            Fiyatlandırma
          </a>
          <Link href="/contact" className={navLinkClassName}>
            İletişim
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <UserAvatarMenu
              userInitials={userInitials}
              onLogout={logout}
              onNavigate={(path) => router.push(path)}
            />
          ) : (
            <PanelLoginLink />
          )}
        </div>

        <div className="flex md:hidden items-center gap-2 sm:gap-3">
          {user ? (
            <UserAvatarMenu
              userInitials={userInitials}
              onLogout={logout}
              onNavigate={(path) => router.push(path)}
            />
          ) : (
            <PanelLoginLink />
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2.5 text-foreground rounded-lg hover:bg-muted/60 transition-colors"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-border px-4 sm:px-6 pb-4 pt-2 flex flex-col gap-1 max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto">
          <a href="/#why-us" onClick={() => setOpen(false)} className={cn(navLinkClassName, "py-2.5")}>
            Neden biz
          </a>
          <a href="/#pricing" onClick={() => setOpen(false)} className={cn(navLinkClassName, "py-2.5")}>
            Fiyatlandırma
          </a>
          <Link href="/contact" onClick={() => setOpen(false)} className={cn(navLinkClassName, "py-2.5")}>
            İletişim
          </Link>
          {user ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Link href="/dashboard/genel-bakis" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground min-h-11">
                  {userFullName}
                </Button>
              </Link>
              <Button
                variant="heroOutline"
                size="sm"
                className="w-full min-h-11"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                Çıkış Yap
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
