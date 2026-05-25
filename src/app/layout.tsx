import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Pickle Palms 2026",
  description: "The official scoreboard, prediction market, and trash talk HQ.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const rooting = session?.user
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          rootingForTeam: true,
          rootingForPlayer: { select: { id: true, name: true, teamId: true } },
        },
      })
    : null;
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Providers>
          <Header
            user={
              session?.user
                ? {
                    id: session.user.id,
                    name: session.user.name ?? "Player",
                    isAdmin: session.user.isAdmin,
                    rootingForTeam: rooting?.rootingForTeam ?? null,
                    rootingForPlayer: rooting?.rootingForPlayer ?? null,
                  }
                : null
            }
          />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
          <footer className="border-t border-ink/10 py-4 text-center">
            <span className="kicker">Pickle Palms 2026 · The Official Scoreboard</span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
