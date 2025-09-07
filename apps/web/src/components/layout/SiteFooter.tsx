// Path: apps/web/src/components/layout/SiteFooter.tsx
// NOTE: New file. Provides a consistent footer with product/company links and
// copy that reinforces the overlap-first concept.
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[rgb(var(--color-border))]">
      <div className="container-page py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-semibold mb-2">MyListLink</div>
          <p className="muted">
            Build lists of 7. Discover via overlaps. Follow the trails that
            connect ideas across people and topics.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-2">Product</div>
          <ul className="space-y-1">
            <li><Link href="/discover" className="hover:underline">Discover</Link></li>
            <li><Link href="/create" className="hover:underline">Create</Link></li>
            <li><Link href="/signin" className="hover:underline">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Company</div>
          <ul className="space-y-1">
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
            <li><Link href="/tos" className="hover:underline">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--color-border))] py-4">
        <div className="container-page text-xs muted">
          © {new Date().getFullYear()} MyListLink. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

