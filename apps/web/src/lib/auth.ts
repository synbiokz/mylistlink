import NextAuth from "next-auth";
import { getToken } from "next-auth/jwt";
import { authConfig } from "@/lib/authConfig";

const nextAuth = NextAuth(authConfig);

export const { handlers, auth, signIn, signOut } = nextAuth;

export async function requireSession(req: Request) {
  try {
    const token = await getToken({ req: req as Parameters<typeof getToken>[0]["req"], secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) return null;
    const payload = token as { email?: string | null; name?: string | null; sub: string };
    return { user: { id: Number(payload.sub), email: payload.email ?? null, name: payload.name ?? null } };
  } catch (err) {
    console.error("[requireSession] getToken error", err);
    return null;
  }
}
