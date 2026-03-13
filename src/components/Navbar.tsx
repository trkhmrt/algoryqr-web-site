"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { StoredUser } from "@/lib/api";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  initialUser?: StoredUser | null;
}

const Navbar = ({ initialUser = null }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(initialUser);
  const router = useRouter();
  const userFullName = (user?.first_name || user?.last_name)
    ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
    : "Hesabım";
  const userInitials =
    ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("algory_user");
    }
    await axios.post("/api/auth/logout", undefined, { withCredentials: true }).catch(() => undefined);
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-foreground" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Algory<span className="text-muted-foreground">QR</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Özellikler
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Fiyatlandırma
          </a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            SSS
          </a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground leading-none">{userFullName}</p>
                {user.email && <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>}
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label="Profil menusu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="hero" size="sm">
                  Ücretsiz Dene
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="p-2 text-foreground">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-border px-4 pb-4 pt-2 flex flex-col gap-3">
          <a href="#features" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            Özellikler
          </a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            Fiyatlandırma
          </a>
          <a href="#faq" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            SSS
          </a>
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                    {userFullName}
                  </Button>
                </Link>
                <Button
                  variant="heroOutline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                >
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="hero" size="sm" className="w-full">
                    Ücretsiz Dene
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
