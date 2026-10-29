import { AlertTriangle, CheckCircle2, CircleSlash, Loader2, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone = "ready" | "pending" | "offline" | "warning" | "idle";

const TONES: Record<
  StatusTone,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  ready: { label: "Ready", icon: CheckCircle2, className: "text-success" },
  pending: { label: "Checking", icon: Loader2, className: "text-info" },
  offline: { label: "Offline", icon: CircleSlash, className: "text-destructive" },
  warning: { label: "Attention", icon: AlertTriangle, className: "text-warning" },
  idle: { label: "Not started", icon: MinusCircle, className: "text-muted-foreground" },
};

interface StatusIndicatorProps {
  label: string;
  tone: StatusTone;
  /** Text shown next to the icon. Falls back to the tone's default wording. */
  value?: string | undefined;
  detail?: string | undefined;
}

/**
 * Status row. Meaning is carried by an icon plus text, never by colour alone.
 */
export function StatusIndicator({ label, tone, value, detail }: StatusIndicatorProps) {
  const config = TONES[tone];
  const Icon = config.icon;
  const text = value ?? config.label;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {detail ? <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <p className={cn("flex shrink-0 items-center gap-1.5 text-sm font-medium", config.className)}>
        <Icon
          aria-hidden="true"
          className={cn("size-4", tone === "pending" && "animate-spin")}
        />
        <span>{text}</span>
      </p>
    </div>
  );
}
