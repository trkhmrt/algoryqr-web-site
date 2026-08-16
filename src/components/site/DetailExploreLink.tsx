import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DetailExploreLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function DetailExploreLink({ href, children, className }: DetailExploreLinkProps) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex w-full transition-transform duration-200 hover:-translate-y-px sm:w-auto", className)}
    >
      <Button
        variant="hero"
        size="lg"
        className="btn-shine btn-shine-pulse relative w-full min-h-11 gap-2 sm:w-auto"
      >
        {children}
        <ArrowRight
          className="relative z-[3] size-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        />
      </Button>
    </Link>
  );
}
