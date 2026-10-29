import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  BookOpen,
  Camera,
  Cpu,
  Hand,
  Info,
  MessageSquareText,
  ShieldCheck,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LearnCard } from "@/components/LearnCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bhasha — Indian Sign Language Translator" },
      {
        name: "description",
        content:
          "Bhasha is an assistive tool that turns Indian Sign Language into text and speech, and helps you learn ISL signs.",
      },
      {
        property: "og:title",
        content: "Bhasha — Indian Sign Language Translator",
      },
      {
        property: "og:description",
        content:
          "Turn Indian Sign Language into text and speech. An accessible, assistive communication tool.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: Camera,
    title: "Camera",
    text: "Your webcam captures the signing.",
  },
  {
    icon: Hand,
    title: "Hand detection",
    text: "Hand and pose points are located in the frame.",
  },
  {
    icon: Cpu,
    title: "Recognition",
    text: "The model matches the shape to a known sign.",
  },
  {
    icon: MessageSquareText,
    title: "Text",
    text: "Confirmed signs build a sentence.",
  },
  {
    icon: Volume2,
    title: "Speech",
    text: "The sentence is spoken aloud.",
  },
];

function Home() {
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative min-h-[680px] overflow-hidden border-b border-border">
        {/* Homepage background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/homepage.jpeg')",
          }}
          aria-hidden="true"
        />

        {/* Light readability overlay */}
        <div
          className="absolute inset-0 bg-background/25"
          aria-hidden="true"
        />

        {/* Subtle protection behind the text */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-background/55 via-background/25 to-transparent"
          aria-hidden="true"
        />

        {/* Hero content */}
        <div className="relative z-10 container-page grid gap-10 py-16 md:grid-cols-12 md:py-24 lg:min-h-[680px] lg:items-center">
          {/* Main hero text */}
          <div className="md:col-span-8 lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm">
              <Accessibility
                aria-hidden="true"
                className="size-4"
              />
              Assistive communication tool
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Indian Sign Language, translated into text and speech.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/80 md:text-xl">
              Bhasha helps people who sign and people who do not sign
              understand each other. Show a sign to your camera, build a
              sentence, and let the app say it out loud.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="min-h-13 px-6 text-base shadow-lg"
              >
                <Link to="/translator">
                  Start translating
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-13 border-border bg-background/90 px-6 text-base shadow-sm backdrop-blur-sm"
              >
                <Link to="/learn">
                  <BookOpen aria-hidden="true" />
                  Learn ISL
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm font-medium text-foreground/70">
              Free to use. No account needed. Works on phones and computers.
            </p>
          </div>

          
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        aria-labelledby="how-heading"
        className="container-page py-14 md:py-16"
      >
        <h2
          id="how-heading"
          className="text-2xl font-bold sm:text-3xl"
        >
          How it works
        </h2>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Five simple steps, from the camera to a spoken sentence.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>

                <step.icon
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
              </div>

              <h3 className="mt-4 text-base font-bold">
                {step.title}
              </h3>

              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURES */}
      <section
        aria-labelledby="features-heading"
        className="border-y border-border bg-surface"
      >
        <div className="container-page py-14 md:py-16">
          <h2
            id="features-heading"
            className="text-2xl font-bold sm:text-3xl"
          >
            What Bhasha does
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <LearnCard
              icon={Camera}
              title="Live sign translation"
              description="Show a sign to your camera and see the recognised word with a confidence reading."
              to="/translator"
              linkLabel="Open the translator"
            />

            <LearnCard
              icon={MessageSquareText}
              title="Sentence building"
              description="Confirmed signs join together into a sentence. Undo, clear, or edit any word."
            />

            <LearnCard
              icon={Volume2}
              title="Speech output"
              description="Your sentence can be read aloud so a hearing listener can respond straight away."
            />

            <LearnCard
              icon={BookOpen}
              title="ISL reference library"
              description="Browse the alphabet, numbers, greetings, questions, and everyday words."
              to="/learn"
              linkLabel="Browse signs"
            />
          </div>
        </div>
      </section>

      {/* ACCURACY NOTICE */}
      <section className="container-page py-14">
        <div className="rounded-lg border-2 border-warning/40 bg-warning/10 p-5 md:p-6">
          <div className="flex gap-3">
            <Info
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-warning"
            />

            <div>
              <h2 className="text-base font-bold">
                Please read: accuracy and intended use
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Sign recognition is not perfect. Accuracy changes with
                lighting, camera quality, background, distance, and
                individual signing style, and regional variation in Indian
                Sign Language is common. Bhasha is an assistive tool to
                support everyday conversation. Do not rely on it alone for
                medical, legal, emergency, or other high-stakes communication
                — use a qualified human interpreter in those situations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}