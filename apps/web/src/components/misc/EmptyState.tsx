export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="surface p-8 text-center">
      <div className="h-16 skel mx-auto w-16 rounded-full" />
      <h3 className="h2 mt-4">{title}</h3>
      {message && <p className="muted mt-2">{message}</p>}
    </div>
  );
}

