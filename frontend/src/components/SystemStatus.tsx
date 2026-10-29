import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIndicator, type StatusTone } from "@/components/StatusIndicator";
import type { ConnectionState, ModelStatus } from "@/services/mlApi";
import type { CameraState } from "@/components/CameraView";

interface SystemStatusProps {
  cameraState: CameraState;
  handDetectionAvailable: boolean;
  handDetectionActive: boolean;
  modelStatus: ModelStatus | null;
  checking: boolean;
  onRefresh: () => void;
}

function connectionTone(state: ConnectionState | undefined, checking: boolean): StatusTone {
  if (checking) return "pending";
  if (state === "online") return "ready";
  if (state === "offline") return "offline";
  return "idle";
}

function connectionText(state: ConnectionState | undefined, checking: boolean): string {
  if (checking) return "Checking…";
  if (state === "online") return "Connected";
  if (state === "offline") return "Offline";
  return "Unknown";
}

const CAMERA_TONE: Record<CameraState, StatusTone> = {
  idle: "idle",
  requesting: "pending",
  active: "ready",
  denied: "offline",
  error: "offline",
};

const CAMERA_TEXT: Record<CameraState, string> = {
  idle: "Off",
  requesting: "Requesting",
  active: "Active",
  denied: "Blocked",
  error: "Error",
};

export function SystemStatus({
  cameraState,
  handDetectionAvailable,
  handDetectionActive,
  modelStatus,
  checking,
  onRefresh,
}: SystemStatusProps) {
  return (
    <section
      aria-labelledby="status-heading"
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="status-heading" className="text-base font-bold">
          System status
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={checking}
          aria-label="Refresh system status"
        >
          <RefreshCw aria-hidden="true" className={checking ? "animate-spin" : undefined} />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="mt-2" aria-live="polite">
        <StatusIndicator label="Camera" tone={CAMERA_TONE[cameraState]} value={CAMERA_TEXT[cameraState]} />
        <StatusIndicator
          label="Hand detection"
          tone={
            !handDetectionAvailable ? "offline" : handDetectionActive ? "ready" : "idle"
          }
          value={
            !handDetectionAvailable ? "Offline" : handDetectionActive ? "Ready" : "Not started"
          }
          detail="Provided by the recognition backend"
        />
        <StatusIndicator
          label="ML model"
          tone={connectionTone(modelStatus?.model, checking)}
          value={connectionText(modelStatus?.model, checking)}
          detail={modelStatus?.modelVersion ? `Version ${modelStatus.modelVersion}` : undefined}
        />
        <StatusIndicator
          label="API"
          tone={connectionTone(modelStatus?.api, checking)}
          value={connectionText(modelStatus?.api, checking)}
        />
        <StatusIndicator
          label="Dataset"
          tone={connectionTone(modelStatus?.dataset, checking)}
          value={
            checking
              ? "Checking…"
              : modelStatus?.dataset === "online"
                ? "Available"
                : "Unavailable"
          }
        />
      </div>

      {modelStatus?.message ? (
        <p className="mt-3 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
          {modelStatus.message}
        </p>
      ) : null}
    </section>
  );
}
