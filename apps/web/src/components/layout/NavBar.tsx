"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";
import { Avatar } from "@/components/ui/Avatar";
import { useMe } from "@/hooks/useMe";
import { getServices } from "@/services";

export function NavBar() {
  const pathname = usePathname();
  const { data: me } = useMe();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]/82 backdrop-blur-xl">
      <div className="container-page flex h-18 items-center gap-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-brand-500))] text-white shadow-sm">
              7
            </span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.28em] text-[rgb(var(--color-muted))]">books and overlap</span>
              <span>ListLink</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <NavLink href="/discover" currentPath={pathname} label="Discover" />
            <NavLink href="/lists" currentPath={pathname} label="Lists" />
            <NavLink href="/about" currentPath={pathname} label="About" />
          </nav>
        </div>

        <div className="max-w-xl flex-1">
          <SearchBox />
        </div>

        <div className="relative ml-auto flex items-center gap-2">
          <Link href="/create" className="hidden sm:block">
            <Button variant="primary">Build Your 7</Button>
          </Link>
          {me ? (
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[rgb(var(--color-accent))]"
                onClick={() => setMenuOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar size={20} alt={me.name ?? me.handle} src={me.avatarUrl ?? null} />
                <span className="hidden truncate sm:inline">@{me.handle}</span>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-44 surface p-2" role="menu" onMouseLeave={() => setMenuOpen(false)}>
                  <Link href={`/user/${me.handle}`} className="block rounded px-2 py-1 hover:bg-[rgb(var(--color-accent))]" role="menuitem">
                    My Profile
                  </Link>
                  <Link href="/create" className="block rounded px-2 py-1 hover:bg-[rgb(var(--color-accent))]" role="menuitem">
                    Create List
                  </Link>
                  <button
                    className="w-full rounded px-2 py-1 text-left hover:bg-[rgb(var(--color-accent))]"
                    role="menuitem"
                    onClick={async () => {
                      setMenuOpen(false);
                      await getServices().auth.signOut({ callbackUrl: "/" });
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
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

function NavLink({ href, label, currentPath }: { href: string; label: string; currentPath: string | null }) {
  const active = currentPath === href || (href !== "/" && currentPath?.startsWith(href) === true);
  return (
    <Link
      href={href}
      className={"rounded-md px-2 py-1 transition-colors " + (active ? "bg-[rgb(var(--color-accent))]" : "hover:bg-[rgb(var(--color-accent))]")}
    >
      {label}
    </Link>
  );
}
