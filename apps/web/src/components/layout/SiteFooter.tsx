import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))]/45">
      <div className="container-page grid grid-cols-1 gap-8 py-12 text-sm sm:grid-cols-3">
        <div>
          <div className="mb-2 font-semibold">ListLink Books</div>
          <p className="muted max-w-sm">
            Make expressive 7-book lists. Follow the overlap between books, readers, and themes.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold">Product</div>
          <ul className="space-y-1">
            <li><Link href="/discover" className="hover:underline">Discover</Link></li>
            <li><Link href="/lists" className="hover:underline">Browse lists</Link></li>
            <li><Link href="/create" className="hover:underline">Create</Link></li>
            <li><Link href="/signin" className="hover:underline">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold">Company</div>
          <ul className="space-y-1">
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--color-border))] py-4">
        <div className="container-page text-xs muted">
          Copyright {new Date().getFullYear()} ListLink Books.
        </div>
      </div>
    </footer>
  );
}
