import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SamplesPage() {
  const users = await prisma.user.findMany({ where: { isSample: true }, orderBy: { handle: "asc" }, select: { handle: true, name: true } });
  return (
    <div className="space-y-6">
      <h1 className="h1">Sample Users</h1>
      {users.length === 0 ? (
        <div className="muted text-sm">No sample users found. Run seeding scripts to create them.</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {users.map((u) => (
            <li key={u.handle} className="surface p-3">
              <div className="font-medium truncate">{u.name ?? u.handle}</div>
              <div className="muted truncate mb-2">@{u.handle}</div>
              <Link href={`/user/${u.handle}`} className="underline">View profile</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

