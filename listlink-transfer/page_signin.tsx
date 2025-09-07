// Path: apps/web/src/app/signin/page.tsx
// NOTE: New file. Placeholder sign-in screen matching the shell’s styling.
// NOTE: rename this file to page.tsx when it is placed in it's appropriate directory
export default function SignInPage() {
  return (
    <div className="max-w-md">
      <h1 className="h1 mb-2">Sign in</h1>
      <p className="muted mb-6">Use email magic link or OAuth providers.</p>
      <div className="surface p-4">
        <div className="h-28 skel" />
      </div>
    </div>
  );
}
