"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { FanBadge } from "@/components/FanBadge";

type TeamLite = { id: string; name: string; color: string; emoji: string | null };
type PlayerLite = { id: string; name: string; teamId: string };

type HeaderUser = {
  id: string;
  name: string;
  isAdmin: boolean;
  rootingForTeam: TeamLite | null;
  rootingForPlayer: PlayerLite | null;
} | null;

const links = [
  { href: "/", label: "Scoreboard" },
  { href: "/events", label: "Events" },
  { href: "/teams", label: "Teams" },
  { href: "/leaderboard", label: "Picks" },
  { href: "/lounge", label: "Lounge" },
];

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-court">
          <span aria-hidden>🥒</span>
          <span className="hidden sm:inline">Burton Valley Dads</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                  active ? "bg-court text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
                pathname?.startsWith("/admin")
                  ? "bg-slate-800 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link
                href="/me"
                className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-slate-900"
                title="Your profile"
              >
                <span>{user.name}</span>
                {user.rootingForTeam ? (
                  <FanBadge
                    team={user.rootingForTeam}
                    player={user.rootingForPlayer}
                    size="xs"
                  />
                ) : (
                  <span className="badge bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px]">
                    Pick a team
                  </span>
                )}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-secondary"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
