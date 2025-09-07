// Path: apps/web/src/components/layout/NavBar.tsx
// NOTE: New file. Introduces sticky top nav with search, primary CTAs,
// and route-aware highlighting. Uses "@/components" alias to live under /src/.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]/80 backdrop-blur">
      <div className="container-page h-16 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight text-lg">
            MyListLink
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <NavLink href="/discover" currentPath={pathname} label="Discover" />
            <NavLink href="/about" currentPath={pathname} label="About" />
          </nav>
        </div>

        <div className="flex-1 max-w-xl">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/create" className="hidden sm:block">
            <Button variant="primary">Create List</Button>
          </Link>
          <Link href="/signin">
            <Button variant="ghost">Sign in</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  currentPath,
}: {
  href: string;
  label: string;
  currentPath: string | null;
}) {
  const active =
    currentPath === href ||
    (href !== "/" && currentPath?.startsWith(href) === true);
  return (
    <Link
      href={href}
      className={
        "px-2 py-1 rounded-md transition-colors " +
        (active
          ? "bg-[rgb(var(--color-accent))]"
          : "hover:bg-[rgb(var(--color-accent))]")
      }
    >
      {label}
    </Link>
  );
}

