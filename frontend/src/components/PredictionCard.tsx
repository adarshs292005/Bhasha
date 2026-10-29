import { cn } from "@/lib/utils";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import type { Prediction } from "@/services/mlApi";

export type PredictionStatus =
  | "not-connected"
  | "idle"
  | "listening"
  | "stabilising"
  | "recognised"
  | "error";

const STATUS_TEXT: Record<PredictionStatus, string> = {
  "not-connected": "Recognition backend not connected",
  idle: "Waiting to start",
  listening: "Watching for a sign",
  stabilising: "Holding sign — confirming",
  recognised: "Sign confirmed",
  error: "Recognition unavailable",
};

interface PredictionCardProps {
  prediction: Prediction | null;
  status: PredictionStatus;
  /** 0..1 progress towards a stable, committed prediction. */
  stability: number;
}

export function PredictionCard({ prediction, status, stability }: PredictionCardProps) {
  const hasPrediction = Boolean(prediction);

  return (
    <section
      aria-labelledby="prediction-heading"
      className="rounded-lg border border-border bg-card p-4"
    >
      <h2 id="prediction-heading" className="text-base font-bold">
        Detected sign
      </h2>

      <div
        className="mt-3 rounded-md border-2 border-dashed border-border-strong bg-surface px-4 py-8 text-center"
        aria-live="polite"
        aria-atomic="true"
      >
        {hasPrediction ? (
          <p className="break-words font-mono text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl">
            {prediction?.label}
          </p>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            {status === "not-connected"
              ? "No sign can be recognised until the recognition backend is connected."
              : "No sign detected yet."}
          </p>
        )}
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span
          className={cn(
            "inline-block size-2.5 rounded-full",
            status === "recognised"
              ? "bg-success"
              : status === "stabilising"
                ? "bg-warning"
                : status === "error" || status === "not-connected"
                  ? "bg-destructive"
                  : "bg-border-strong",
          )}
          aria-hidden="true"
        />
        <span>
          <span className="sr-only">Prediction status: </span>
          {STATUS_TEXT[status]}
        </span>
      </p>

      <div className="mt-4">
        <ConfidenceIndicator value={prediction?.confidence ?? null} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sign hold progress
        </p>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Sign hold progress before the sign is added to the sentence"
          aria-valuenow={Math.round(stability * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${Math.round(stability * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Hold a sign steady until this bar fills to add it to your sentence.
        </p>
      </div>

      {prediction?.modelVersion ? (
        <p className="mt-3 text-xs text-muted-foreground">Model version: {prediction.modelVersion}</p>
      ) : null}
    </section>
  );
}
