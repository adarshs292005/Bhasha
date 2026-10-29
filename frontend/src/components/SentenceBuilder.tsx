import { Bookmark, Eraser, Plus, Undo2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpeakButton } from "@/components/SpeakButton";
import type { SavedSentence, SentenceToken } from "@/hooks/useSentenceBuilder";

interface SentenceBuilderProps {
  tokens: SentenceToken[];
  sentence: string;
  saved: SavedSentence[];
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  onRemove: (id: string) => void;
  onAddManual: (label: string) => void;
  onError?: (message: string) => void;
}

export function SentenceBuilder({
  tokens,
  sentence,
  saved,
  onUndo,
  onClear,
  onSave,
  onRemove,
  onAddManual,
  onError,
}: SentenceBuilderProps) {
  const [draft, setDraft] = useState("");
  const empty = tokens.length === 0;

  return (
    <section
      aria-labelledby="sentence-heading"
      className="rounded-lg border border-border bg-card p-4"
    >
      <h2 id="sentence-heading" className="text-base font-bold">
        Sentence builder
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirmed signs are added here in order. Repeated frames of the same sign are only added
        once.
      </p>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Detected signs
      </h3>
      <div className="mt-2 min-h-20 rounded-md border border-border bg-surface p-3">
        {empty ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No signs added yet. Confirmed signs will appear here.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Detected signs in order">
            {tokens.map((token, index) => (
              <li key={token.id}>
                <span className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-card py-1.5 pl-3 pr-1.5 font-mono text-sm font-bold uppercase">
                  <span className="sr-only">Sign {index + 1}: </span>
                  {token.label}
                  <button
                    type="button"
                    onClick={() => onRemove(token.id)}
                    aria-label={`Remove ${token.label} from the sentence`}
                    className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Result
      </h3>
      <p
        className="mt-2 min-h-16 rounded-md border-2 border-border-strong bg-background px-4 py-3 text-2xl font-bold leading-snug"
        aria-live="polite"
        aria-atomic="true"
      >
        {sentence || (
          <span className="text-base font-medium text-muted-foreground">
            Your sentence will be written here.
          </span>
        )}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          size="lg"
          variant="outline"
          className="min-h-12"
          onClick={onUndo}
          disabled={empty}
        >
          <Undo2 aria-hidden="true" />
          <span>Undo</span>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="min-h-12"
          onClick={onClear}
          disabled={empty}
        >
          <Eraser aria-hidden="true" />
          <span>Clear</span>
        </Button>
        <SpeakButton text={sentence} className="min-h-12" onError={onError} />
        <Button
          size="lg"
          variant="secondary"
          className="min-h-12"
          onClick={onSave}
          disabled={empty}
        >
          <Bookmark aria-hidden="true" />
          <span>Save</span>
        </Button>
      </div>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onAddManual(draft);
          setDraft("");
        }}
      >
        <div className="flex-1">
          <label htmlFor="manual-word" className="text-xs font-semibold text-muted-foreground">
            Add a word by typing (useful when a sign is not recognised)
          </label>
          <Input
            id="manual-word"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="e.g. WATER"
            className="mt-1 min-h-12 text-base"
          />
        </div>
        <Button type="submit" size="lg" variant="outline" className="min-h-12 sm:mt-6">
          <Plus aria-hidden="true" />
          <span>Add word</span>
        </Button>
      </form>

      {saved.length > 0 ? (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved sentences
          </h3>
          <ul className="mt-2 space-y-2">
            {saved.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <span className="truncate text-sm font-medium">{entry.text}</span>
                <SpeakButton text={entry.text} size="default" onError={onError} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
