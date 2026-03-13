import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const [open, setOpen] = useState(false);

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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
