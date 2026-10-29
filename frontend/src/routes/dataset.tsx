import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { DatasetCollector } from "@/components/DatasetCollector";

export const Route = createFileRoute("/dataset")({
  head: () => ({
    meta: [
      {
        title: "Dataset Collector — Bhasha",
      },
      {
        name: "description",
        content:
          "Help improve Bhasha by collecting Indian Sign Language hand-sign samples.",
      },
    ],
  }),
  component: DatasetPage,
});

const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

function ReferenceCard({ item }: { item: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-square w-full bg-surface">
        <img
          src={`/signs/characters/${item}.jpg`}
          alt={`Indian Sign Language sign for ${item}`}
          loading="lazy"
          className="size-full object-contain"
        />
      </div>

      <div className="border-t border-border p-3 text-center">
        <p className="font-mono text-lg font-bold">{item}</p>
      </div>
    </div>
  );
}

function ReferenceGroup({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <section>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {items.map((item) => (
          <ReferenceCard key={item} item={item} />
        ))}
      </div>
    </section>
  );
}

function DatasetPage() {
  return (
    <div className="container-page py-8 md:py-10">
      {/* Header */}
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Indian Sign Language Dataset
        </h1>

        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Help improve Bhasha by contributing real-world Indian Sign Language
          hand-sign samples. Choose a sign, allow camera access, and capture
          your hand landmarks.
        </p>
      </header>

      {/* Dataset information */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-3xl font-extrabold">36</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Character Classes
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            0–9 and A–Z
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-3xl font-extrabold">50</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Samples Per Sign
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Target collection size
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-3xl font-extrabold">126</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Features
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Two hands × 21 landmarks × 3 coordinates
          </p>
        </div>
      </div>

      {/* Dataset collector */}
      <section className="mt-10">
        <DatasetCollector />
      </section>

      {/* Reference section */}
      <section className="mt-14">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Sign Reference
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Use these reference images while collecting samples. Numbers and
            alphabet signs use the same local reference images used throughout
            Bhasha.
          </p>
        </div>

        {/* Numbers */}
        <ReferenceGroup
          title="Numbers"
          description="Indian Sign Language number signs from 0 to 9."
          items={numbers}
        />

        {/* Alphabet */}
        <div className="mt-12">
          <ReferenceGroup
            title="Alphabet"
            description="Indian Sign Language fingerspelling reference from A to Z."
            items={alphabet}
          />
        </div>
      </section>

      {/* Words */}
      <section className="mt-12">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Word Sign Reference
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                For words such as HELLO, WATER, HELP, THANK YOU, and other
                everyday signs, use the ISL dictionary for reference.
              </p>
            </div>

            <a
              href="https://indiansignlanguage.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Open ISL Dictionary
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mt-8">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-bold">Privacy</h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Please use an anonymous participant ID such as P01, P02, or P03.
            Do not enter your name or other personal information. Bhasha
            collects hand landmark features and basic dataset metadata for
            model development.
          </p>
        </div>
      </section>
    </div>
  );
}