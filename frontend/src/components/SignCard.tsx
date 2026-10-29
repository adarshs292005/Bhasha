import { ImageOff } from "lucide-react";
import type { SignEntry } from "@/services/signLibrary";

interface SignCardProps {
  sign: SignEntry;
}

/**
 * Returns the local reference image path for
 * ISL numbers 1-9 and alphabet A-Z.
 */
function getLocalReferenceImage(name: string): string | null {
  const value = name.trim().toUpperCase();

  const isNumber = /^[0-9]$/.test(value);
  const isLetter = /^[A-Z]$/.test(value);

  if (!isNumber && !isLetter) {
    return null;
  }

  return `/signs/characters/${value}.jpg`;
}

/** Reference card for a single sign in the Learn ISL library. */
export function SignCard({ sign }: SignCardProps) {
  const localImageUrl = getLocalReferenceImage(sign.name);

  const imageUrl = localImageUrl ?? sign.imageUrl;

  const imageAlt = localImageUrl
    ? `Indian Sign Language sign for ${sign.name}`
    : sign.imageAlt;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-4/3 w-full border-b border-border bg-surface">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center">
            <ImageOff
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />

            <p className="text-xs font-medium text-muted-foreground">
              Reference illustration not available yet
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-mono text-xl font-bold uppercase">
            {sign.name}
          </h3>

          <span className="shrink-0 rounded border border-border bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            {sign.category}
          </span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {sign.description}
        </p>

        {sign.example ? (
          <p className="mt-3 border-l-2 border-primary pl-3 text-sm font-medium text-foreground">
            <span className="sr-only">Example: </span>
            {sign.example}
          </p>
        ) : null}
      </div>
    </article>
  );
}