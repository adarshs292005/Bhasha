import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, Cpu, Database, Info, Lock, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Bhasha — How the ISL translator works" },
      {
        name: "description",
        content:
          "How Bhasha recognises Indian Sign Language, what it can and cannot do, and how privacy and accessibility are handled.",
      },
      { property: "og:title", content: "About Bhasha — How the ISL translator works" },
      {
        property: "og:description",
        content:
          "How Bhasha recognises Indian Sign Language, what it can and cannot do, and how accessibility is handled.",
      },
    ],
  }),
  component: About,
});

const SECTIONS = [
  {
    icon: Workflow,
    title: "How recognition works",
    body: "Your camera captures video in the browser. Hand and pose information is located in each frame and passed to a recognition service, which returns a candidate sign and a confidence score. Bhasha waits for a sign to be held steady before adding it to your sentence, so a single sign is not repeated many times.",
  },
  {
    icon: Cpu,
    title: "The recognition model",
    body: "The recognition model is developed and evaluated separately from this interface. Bhasha does not claim any specific accuracy figure: whatever confidence you see comes directly from the connected model. If no model is connected, the app says so plainly instead of showing invented results.",
  },
  {
    icon: Lock,
    title: "Camera and privacy",
    body: "The camera only runs while you have started it, and a clear indicator shows when it is active. Video is used for recognition and is not stored by this interface. If a recognition service is connected, frames or extracted hand points are sent to it for processing.",
  },
  {
    icon: Accessibility,
    title: "Accessibility commitments",
    body: "All controls are keyboard reachable with visible focus, labelled for screen readers, and sized for comfortable touch. Status and errors are communicated with text and icons, not colour alone. Layouts reflow for small screens and reduced-motion preferences are respected.",
  },
  {
    icon: Database,
    title: "Sign reference data",
    body: "The Learn ISL library describes handshapes in words so it remains useful before illustrations are attached. Reference images and additional signs can be added later without changing how the page works.",
  },
];

function About() {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">About Bhasha</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Bhasha is an assistive technology project for Indian Sign Language. Its goal is simple:
          make everyday conversation easier between people who sign and people who do not.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-lg border border-border bg-card p-6">
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <section.icon aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-lg border-2 border-warning/40 bg-warning/10 p-6">
        <div className="flex gap-3">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
          <div>
            <h2 className="text-base font-bold">Limitations</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Recognition quality depends on lighting, camera angle, and background.</li>
              <li>Indian Sign Language has regional variation; not every variant is covered.</li>
              <li>Facial expression and grammar carried by the body are not fully captured.</li>
              <li>
                Bhasha is not a substitute for a qualified interpreter in medical, legal, or
                emergency situations.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="min-h-12">
          <Link to="/translator">Open the translator</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="min-h-12">
          <Link to="/learn">Browse the sign library</Link>
        </Button>
      </div>
    </div>
  );
}
