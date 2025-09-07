// Path: apps/web/src/app/discover/page.tsx
// NOTE: New file. Route scaffold to host Trending Items / Hot Overlaps / New Today.
// NOTE: rename this file to page.tsx when it is placed in it's appropriate directory
export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <h1 className="h1">Discover</h1>
      <p className="muted">Trending Items • Hot Overlaps • New Today</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="surface p-4">
            <div className="h-24 skel" />
          </div>
        ))}
      </div>
    </div>
  );
}
