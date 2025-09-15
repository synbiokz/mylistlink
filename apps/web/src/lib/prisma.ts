import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function resolveSqliteUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:")) return undefined;
  const rel = url.replace(/^file:/, "");
  const candidates = [rel, path.join("apps", "web", rel)];
  for (const c of candidates) {
    const abs = path.isAbsolute(c) ? c : path.resolve(process.cwd(), c);
    if (fs.existsSync(abs)) {
      return `file:${abs.replace(/\\/g, "/")}`;
    }
  }
  return undefined;
}

const overrideUrl = resolveSqliteUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    ...(overrideUrl ? { datasources: { db: { url: overrideUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
