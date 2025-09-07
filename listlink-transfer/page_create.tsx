// Path: apps/web/src/app/create/page.tsx
// NOTE: This file already exists. This version clarifies the two-step wizard structure
// (title/description → exactly 7 items) and aligns styles with the new tokens.
// NOTE: rename this file to page.tsx when it is placed in it's appropriate directory
export default function CreatePage() {
  return (
    <div className="space-y-6">
      <h1 className="h1">Create a List</h1>
      <p className="muted">Two-step wizard: title/description then 7 items.</p>
      <div className="surface p-4">
        <div className="h-40 skel" />
      </div>
    </div>
  );
}
