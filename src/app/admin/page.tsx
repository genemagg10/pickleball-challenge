import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TeamAdmin } from "./TeamAdmin";
import { PlayerAdmin } from "./PlayerAdmin";
import { UserAdmin } from "./UserAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (!session.user.isAdmin) {
    return (
      <div className="card p-6 text-sm text-slate-600">
        You don&apos;t have admin access. Ask the commissioner.
      </div>
    );
  }

  const [teams, players, users, events] = await Promise.all([
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.player.findMany({
      include: { team: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.event.findMany({
      include: { winnerTeam: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Teams</h2>
        <TeamAdmin teams={teams} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Players</h2>
        <PlayerAdmin teams={teams} players={players} users={users} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Events</h2>
          <Link href="/admin/events/new" className="btn-primary">
            + New event
          </Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Pts / matchup</th>
                <th className="p-3">Winner</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={5}>
                    No events yet.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="border-t border-slate-200">
                    <td className="p-3 font-medium">{e.name}</td>
                    <td className="p-3">{e.status.replace("_", " ").toLowerCase()}</td>
                    <td className="p-3 tabular-nums">{e.pointsValue}</td>
                    <td className="p-3">
                      {e.winnerTeam
                        ? `${e.winnerTeam.emoji ?? ""} ${e.winnerTeam.name}`
                        : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="text-court underline text-xs"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Users</h2>
        <UserAdmin users={users} currentUserId={session.user.id} />
      </section>
    </div>
  );
}
