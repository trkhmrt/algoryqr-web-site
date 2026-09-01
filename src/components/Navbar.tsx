"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { StoredUser } from "@/lib/api";
import { getSiteSameOriginAxios } from "@/lib/site-same-origin-axios";
import { useRouter } from "next/navigation";
import { useMyProfile } from "@/hooks/use-my-profile";
import { useNavbarActiveSection } from "@/hooks/use-navbar-active-section";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { SiteLanguagePicker } from "@/components/SiteLanguagePicker";
import { Tx } from "@/components/google-translate-provider";

interface NavbarProps {
  initialUser?: StoredUser | null;
}

type NavItemId = "why-us" | "pricing" | "contact";

const NAV_ITEMS: { id: NavItemId; href: string; label: ReactNode }[] = [
  { id: "why-us", href: "/#why-us", label: <Tx>Neden biz</Tx> },
  { id: "pricing", href: "/#pricing", label: <Tx>Fiyatlandırma</Tx> },
  { id: "contact", href: "/contact", label: <Tx>İletişim</Tx> },
];

function navLinkClass(active: boolean) {
  return cn(
    "text-sm font-semibold transition-colors",
    active
      ? "text-primary"
      : "text-neutral-950 hover:text-primary/80 dark:text-foreground dark:hover:text-primary/80",
  );
}

function NavbarLink({
  href,
  active,
  onClick,
  className,
  children,
}: {
  href: string;
  active: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(navLinkClass(active), className)}
      aria-current={active ? "page" : undefined}
    >
      {children}
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
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary transition-opacity hover:opacity-80"
          aria-label="Profil menusu"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <Tx>Hesabım</Tx>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNavigate("/dashboard/genel-bakis")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <Tx>Çıkış Yap</Tx>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DesktopGuestActions() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="rounded-full font-semibold" asChild>
        <Link href="/login">
          <Tx>Giriş Yap</Tx>
        </Link>
      </Button>
      <Button variant="hero" size="sm" className="rounded-full font-semibold" asChild>
        <Link href="/register">
          <Tx>Ücretsiz Başla</Tx>
        </Link>
      </Button>
    </div>
  );
}

function MobileAuthRow({
  user,
  userFullName,
  onClose,
  onLogout,
}: {
  user: StoredUser | null;
  userFullName: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  if (user) {
    return (
      <div className="mb-1 flex items-center gap-2 border-b border-border pb-2">
        <Link
          href="/dashboard/genel-bakis"
          onClick={onClose}
          className={cn(navLinkClass(false), "py-2")}
        >
          {userFullName}
        </Link>
        <span aria-hidden className="text-muted-foreground/40">
          |
        </span>
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className={cn(navLinkClass(false), "py-2 text-destructive")}
        >
          <Tx>Çıkış Yap</Tx>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-1 flex items-center gap-2 border-b border-border pb-2">
      <Link href="/login" onClick={onClose} className={cn(navLinkClass(false), "py-2")}>
        <Tx>Giriş Yap</Tx>
      </Link>
      <span aria-hidden className="text-muted-foreground/40">
        |
      </span>
      <Link href="/register" onClick={onClose} className={cn(navLinkClass(false), "py-2")}>
        <Tx>Kayıt Ol</Tx>
      </Link>
    </div>
  );
}

const Navbar = ({ initialUser = null }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(initialUser);
  const router = useRouter();
  const activeSection = useNavbarActiveSection();
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

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const desktopNav = window.matchMedia("(min-width: 1024px)");
    const onBreakpointChange = () => {
      if (desktopNav.matches) setOpen(false);
    };
    onBreakpointChange();
    desktopNav.addEventListener("change", onBreakpointChange);
    return () => desktopNav.removeEventListener("change", onBreakpointChange);
  }, []);

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
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 glass transition-shadow duration-300",
        scrolled && "shadow-md",
      )}
    >
      <div className="container mx-auto grid h-14 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:h-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 justify-self-start">
          <BrandLogo priority />
          <span className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Algory<span className="text-muted-foreground">QR</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 whitespace-nowrap lg:flex lg:justify-self-center xl:gap-8">
          {NAV_ITEMS.map((item) => (
            <NavbarLink key={item.id} href={item.href} active={activeSection === item.id}>
              {item.label}
            </NavbarLink>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex lg:justify-self-end">
          <SiteLanguagePicker />
          {user ? (
            <UserAvatarMenu
              userInitials={userInitials}
              onLogout={logout}
              onNavigate={(path) => router.push(path)}
            />
          ) : (
            <DesktopGuestActions />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 justify-self-end lg:hidden">
          <SiteLanguagePicker compact />
          {user ? (
            <UserAvatarMenu
              userInitials={userInitials}
              onLogout={logout}
              onNavigate={(path) => router.push(path)}
            />
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted/60"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Menüyü kapat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-0 left-0 right-0 top-14 z-40 bg-background/75 backdrop-blur-md sm:top-16 lg:hidden"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-50 flex max-h-[min(70vh,calc(100dvh-3.5rem))] touch-pan-y flex-col gap-1 overflow-y-auto overscroll-y-contain border-t border-border bg-background px-4 pb-4 pt-2 sm:px-6 lg:hidden"
            >
              <MobileAuthRow
                user={user}
                userFullName={userFullName}
                onClose={closeMenu}
                onLogout={logout}
              />
              {NAV_ITEMS.map((item) => (
                <NavbarLink
                  key={item.id}
                  href={item.href}
                  active={activeSection === item.id}
                  onClick={closeMenu}
                  className="py-2.5"
                >
                  {item.label}
                </NavbarLink>
              ))}
              {!user ? (
                <Button variant="hero" size="lg" className="mt-2 min-h-11 w-full rounded-full" asChild>
                  <Link href="/register" onClick={closeMenu}>
                    <Tx>Ücretsiz Başla</Tx>
                  </Link>
                </Button>
              ) : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
