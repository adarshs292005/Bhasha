import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface LearnCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to?: "/learn" | "/translator" | "/about";
  linkLabel?: string;
}

/** Compact informational card used on the home and about pages. */
export function LearnCard({ icon: Icon, title, description, to, linkLabel }: LearnCardProps) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {to ? (
        <Link
          to={to}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {linkLabel ?? "Learn more"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
