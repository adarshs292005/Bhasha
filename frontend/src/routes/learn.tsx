import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignCard } from "@/components/SignCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  getSigns,
  SIGN_CATEGORIES,
  type SignCategory,
} from "@/services/signLibrary";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      {
        title: "Learn Indian Sign Language — Bhasha reference library",
      },
      {
        name: "description",
        content:
          "Browse Indian Sign Language numbers, fingerspelling, greetings, questions, and everyday words.",
      },
      {
        property: "og:title",
        content: "Learn Indian Sign Language — Bhasha",
      },
      {
        property: "og:description",
        content:
          "Browse ISL numbers, fingerspelling, greetings, questions, and everyday words with clear descriptions.",
      },
    ],
  }),
  component: Learn,
});

type Filter = SignCategory | "All";

const FILTERS: Filter[] = ["All", ...SIGN_CATEGORIES];

function getSignPriority(name: string): number {
  const value = name.trim().toUpperCase();

  // Numbers 0-9
  if (/^[0-9]$/.test(value)) {
    return Number(value);
  }

  // Alphabet A-Z
  if (/^[A-Z]$/.test(value)) {
    return 10 + (value.charCodeAt(0) - "A".charCodeAt(0));
  }

  // Other signs
  return 100;
}

function Learn() {
  const [category, setCategory] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["signs", category, search],
    queryFn: () => getSigns({ category, search }),
  });

  const results = useMemo(() => {
    const signs = query.data ?? [];

    return [...signs].sort((a, b) => {
      const priorityA = getSignPriority(a.name);
      const priorityB = getSignPriority(b.name);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.name.localeCompare(b.name);
    });
  }, [query.data]);

  return (
    <div className="container-page py-8 md:py-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Learn Indian Sign Language
        </h1>

        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Start with numbers and fingerspelling, then explore greetings,
          questions, and everyday signs. Each card describes the sign in
          plain language.
        </p>
      </header>

      <div className="mt-8 rounded-lg border border-border bg-card p-4">
        <div className="max-w-md">
          <label htmlFor="sign-search" className="text-sm font-semibold">
            Search signs
          </label>

          <div className="relative mt-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              id="sign-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. water, hello, A"
              className="min-h-12 pl-9 text-base"
            />
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">
            Category
          </legend>

          <div className="mt-2 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={category === item ? "default" : "outline"}
                aria-pressed={category === item}
                className="min-h-11"
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-6">
        {query.isPending ? (
          <LoadingState
            title="Loading signs"
            description="Fetching the sign reference library."
          />
        ) : query.isError ? (
          <ErrorMessage
            title="The sign library could not be loaded"
            description="Check your connection and try again."
            action={{
              label: "Retry",
              onClick: () => void query.refetch(),
            }}
          />
        ) : results.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
            <p className="text-base font-semibold">
              No signs match your search
            </p>

            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Try a different word, or choose a different category.
            </p>

            <Button
              variant="outline"
              className="mt-4 min-h-12"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              Showing {results.length}{" "}
              {results.length === 1 ? "sign" : "signs"}
              {category === "All" ? "" : ` in ${category}`}.
            </p>

            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((sign) => (
                <li key={sign.id}>
                  <SignCard sign={sign} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-8 max-w-3xl rounded-lg border border-border bg-card p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Indian Sign Language has regional variation, so this library is
          intended as a starting reference rather than a complete
          dictionary.
        </p>
      </div>
    </div>
  );
}