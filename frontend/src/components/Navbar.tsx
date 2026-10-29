import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BhashaMark } from "@/components/BhashaMark";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/translator", label: "Translator" },
  { to: "/learn", label: "Learn ISL" },
  { to: "/dataset", label: "Dataset" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
      >
        Skip to main content
      </a>

      <nav
        aria-label="Main"
        className="container-page flex h-16 items-center justify-between gap-4"
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md"
          aria-label="Bhasha home"
        >
          <BhashaMark className="h-10 w-auto" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{
                  className: "bg-secondary text-foreground",
                }}
                activeOptions={{
                  exact: link.to === "/",
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li className="ml-2">
            <Button asChild size="lg">
              <Link to="/translator">Start Translating</Link>
            </Button>
          </li>
        </ul>

        <Button
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11 md:hidden"
          aria-label={
            open
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X aria-hidden="true" />
          ) : (
            <Menu aria-hidden="true" />
          )}
        </Button>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-card md:hidden"
        >
          <ul className="container-page flex flex-col py-2">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-3 text-base font-medium text-foreground"
                  activeProps={{
                    className: "bg-secondary",
                  }}
                  activeOptions={{
                    exact: link.to === "/",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}