import { forwardRef } from "react";
import { Camera, CameraOff, Circle, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "@/lib/utils";

export type CameraState = "idle" | "requesting" | "active" | "denied" | "error";

interface CameraViewProps {
  state: CameraState;
  errorMessage?: string | null;
  onStart: () => void;
  onStop: () => void;
  /** Hand detection readout supplied by the recognition pipeline. */
  handsDetected: boolean;
  handDetectionAvailable: boolean;
}

const PERMISSION_TEXT: Record<CameraState, string> = {
  idle: "Camera is off. Nothing is being recorded.",
  requesting: "Waiting for camera permission…",
  active: "Camera is on. Video stays on this device unless a backend is connected.",
  denied: "Camera permission was denied.",
  error: "The camera could not be started.",
};

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(function CameraView(
  { state, errorMessage, onStart, onStop, handsDetected, handDetectionAvailable },
  ref,
) {
  const active = state === "active";

  return (
    <section aria-labelledby="camera-heading" className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id="camera-heading" className="text-base font-bold">
          Camera
        </h2>
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
            active
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          <Circle
            aria-hidden="true"
            className={cn("size-2.5", active ? "fill-destructive" : "fill-muted-foreground")}
          />
          {active ? "Camera active — recording preview" : "Camera off"}
        </p>
      </div>

      <div className="p-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-md border-2 border-border-strong bg-surface">
          <video
            ref={ref}
            playsInline
            muted
            aria-label="Live camera preview used for sign recognition"
            className={cn(
              "size-full scale-x-[-1] object-cover",
              active ? "opacity-100" : "opacity-0",
            )}
          />
          {!active ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <VideoOff aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                {state === "requesting"
                  ? "Requesting camera access…"
                  : "Start the camera to begin translating."}
              </p>
            </div>
          ) : null}
          {active ? (
            <p className="absolute left-3 top-3 rounded bg-foreground/85 px-2 py-1 text-xs font-semibold text-background">
              LIVE
            </p>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {PERMISSION_TEXT[state]}
        </p>

        {state === "denied" || state === "error" ? (
          <div className="mt-3">
            <ErrorMessage
              title={
                state === "denied"
                  ? "Camera permission is blocked"
                  : "The camera could not be started"
              }
              description={
                errorMessage ??
                "Allow camera access in your browser's site settings, then try again."
              }
              action={{ label: "Try again", onClick: onStart }}
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="min-h-12 flex-1"
            onClick={onStart}
            disabled={active || state === "requesting"}
          >
            <Camera aria-hidden="true" />
            <span>Start camera</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-h-12 flex-1"
            onClick={onStop}
            disabled={!active}
          >
            <CameraOff aria-hidden="true" />
            <span>Stop camera</span>
          </Button>
        </div>

        <div className="mt-4 rounded-md border border-border bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hand detection
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {!handDetectionAvailable
              ? "Not available — the detection service is not connected."
              : !active
                ? "Waiting for the camera to start."
                : handsDetected
                  ? "Hands detected in frame."
                  : "No hands detected. Keep both hands inside the frame."}
          </p>
        </div>
      </div>
    </section>
  );
});
