"use client";

import type { ReactNode } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

type LegalPageShellProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export default function LegalPageShell({
  title,
  eyebrow = "Yasal",
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 space-y-3">
            <p className="text-sm font-mono uppercase tracking-widest text-primary">{eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {title}
            </h1>
          </div>
          <article className="space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:text-foreground">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
