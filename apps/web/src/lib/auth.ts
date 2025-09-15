import { getToken } from "next-auth/jwt";

export async function requireSession(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) return null;
    return { user: { id: Number(token.sub), email: (token as any).email ?? null, name: (token as any).name ?? null } };
  } catch (err) {
    console.error("[requireSession] getToken error", err);
    return null;
  }
}
