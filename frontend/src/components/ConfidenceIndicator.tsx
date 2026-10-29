import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  /** Confidence in the 0..1 range, or null when unavailable. */
  value: number | null;
  label?: string;
}

function band(value: number): { text: string; bar: string } {
  if (value >= 0.85) return { text: "High confidence", bar: "bg-success" };
  if (value >= 0.6) return { text: "Moderate confidence", bar: "bg-warning" };
  return { text: "Low confidence", bar: "bg-destructive" };
}

export function ConfidenceIndicator({ value, label = "Confidence" }: ConfidenceIndicatorProps) {
  const hasValue = typeof value === "number" && !Number.isNaN(value);
  const percent = hasValue ? Math.round(Math.min(Math.max(value, 0), 1) * 100) : 0;
  const tone = hasValue ? band(value) : { text: "No reading yet", bar: "bg-border-strong" };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
          {hasValue ? `${percent}%` : "—"}
        </p>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label={label}
        aria-valuenow={hasValue ? percent : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={hasValue ? `${percent} percent, ${tone.text}` : "No reading yet"}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-200", tone.bar)}
          style={{ width: `${hasValue ? percent : 0}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{tone.text}</p>
    </div>
  );
}
