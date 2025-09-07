import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "MyListLink — Build lists of 7. Discover via overlaps.",
  description:
    "Create themed lists of 7 items. Explore overlaps across the community and follow trails of discovery.",
  openGraph: {
    title: "MyListLink",
    description:
      "Create themed lists of 7 items. Explore overlaps across the community.",
    type: "website",
    url: "https://mylistlink.com",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NavBar />
        <main className="container-page py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
