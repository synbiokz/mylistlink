// Path: apps/web/src/components/layout/NavBar.tsx
// NOTE: New file. Introduces sticky top nav with search, primary CTAs,
// and route-aware highlighting. Uses "@/components" alias to live under /src/.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";
import { useMe } from "@/hooks/useMe";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { getServices } from "@/services";

export function NavBar() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);

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

        <div className="ml-auto flex items-center gap-2 relative">
          <Link href="/create" className="hidden sm:block">
            <Button variant="primary">Create List</Button>
          </Link>
          {me ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[rgb(var(--color-accent))]"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar size={20} alt={me.name ?? me.handle} src={me.avatarUrl ?? null} />
                <span className="hidden sm:inline truncate">@{me.handle}</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 surface p-2"
                  role="menu"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href={`/user/${me.handle}`} className="block px-2 py-1 rounded hover:bg-[rgb(var(--color-accent))]" role="menuitem">
                    My Lists
                  </Link>
                  <Link href="/create" className="block px-2 py-1 rounded hover:bg-[rgb(var(--color-accent))]" role="menuitem">
                    Create List
                  </Link>
                  <button
                    className="w-full text-left px-2 py-1 rounded hover:bg-[rgb(var(--color-accent))]"
                    role="menuitem"
                    onClick={async () => {
                      setMenuOpen(false);
                      await getServices().auth.signOut({ callbackUrl: "/" });
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin">
              <Button variant="ghost">Sign in</Button>
            </Link>
          )}
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
