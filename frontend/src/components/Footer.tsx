import { Link } from "@tanstack/react-router";
import { BhashaMark } from "@/components/BhashaMark";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5">
            <BhashaMark className="h-7 w-auto" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            An assistive communication tool for Indian Sign Language. Recognition accuracy varies
            with lighting, camera quality, and signing style. Bhasha supports communication; it does
            not replace a qualified human interpreter.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <li>
              <Link to="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link to="/translator" className="hover:underline">
                Translator
              </Link>
            </li>
            <li>
              <Link to="/learn" className="hover:underline">
                Learn ISL
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:underline">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
