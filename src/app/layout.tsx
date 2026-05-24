import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Burton Valley Dads' Pickleball Challenge",
  description: "The official scoreboard, prediction market, and trash talk HQ.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Header
            user={
              session?.user
                ? {
                    id: session.user.id,
                    name: session.user.name ?? "Player",
                    isAdmin: session.user.isAdmin,
                  }
                : null
            }
          />
          <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            Burton Valley Dads&apos; Pickleball Challenge
          </footer>
        </Providers>
      </body>
    </html>
  );
}
