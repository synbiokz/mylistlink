import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { slugify } from "@/data/util";

export const runtime = "nodejs";

async function uniqueHandle(base: string) {
  let handle = (base || "user").toLowerCase();
  let i = 1;
  while (await prisma.user.findUnique({ where: { handle } })) handle = `${base}-${i++}`;
  return handle;
}

export const authConfig = {
  // JWT sessions; we create users directly in authorize().
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV !== "production",
  providers: [
    Credentials({
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(creds) {
        try {
          const email = (creds?.email || "").toString().trim().toLowerCase();
          const name = (creds?.name || "").toString().trim();
          if (!email) return null;
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            const base = slugify(name || email.split("@")[0]).slice(0, 30) || "user";
            const handle = await uniqueHandle(base);
            user = await prisma.user.create({ data: { email, name: name || null, handle } });
          }
          return { id: String(user.id), email: user.email, name: user.name ?? undefined };
        } catch (err) {
          console.error("[auth.credentials.authorize] error", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        ((session.user as unknown) as { id?: number }).id = Number(token.sub);
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      console.log("[auth.event.signIn]", { user: message.user?.email, account: message.account?.provider });
    },
    async signOut(message) {
      const hasToken = "token" in message;
      console.log("[auth.event.signOut]", { hasToken });
    },
  },
} satisfies NextAuthConfig;

// Use v5 helpers to export handlers and server-side auth utilities.
const { handlers, auth: serverAuth, signIn: serverSignIn, signOut: serverSignOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
export const auth = serverAuth;
export const signIn = serverSignIn;
export const signOut = serverSignOut;
