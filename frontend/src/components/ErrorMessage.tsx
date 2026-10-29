import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorMessageProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
}

export function ErrorMessage({ title, description, action, children }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4"
    >
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
          {children}
          {action ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={action.onClick}>
              {action.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
