"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/hooks/use-theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SiteVisitTracker } from "@/components/SiteVisitTracker";
import { DocumentLocale } from "@/components/DocumentLocale";
import { GoogleTranslateProvider } from "@/components/google-translate-provider";
import { MenuLocaleProvider } from "@/components/menu-templates/shared/menu-locale";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MenuLocaleProvider>
          <GoogleTranslateProvider>
            <DocumentLocale />
            <TooltipProvider>
              <SiteVisitTracker />
              {children}
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </GoogleTranslateProvider>
        </MenuLocaleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
