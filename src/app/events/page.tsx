import Link from "next/link";
import { prisma } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await auth();
  const [events, teams] = await Promise.all([
    prisma.event.findMany({
      include: {
        winnerTeam: true,
        matchups: { select: { winnerTeamId: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.team.findMany({
      select: { id: true, name: true, color: true, emoji: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">All Events</h1>
        {session?.user?.isAdmin && (
          <Link href="/admin/events/new" className="btn-primary">
            + New event
          </Link>
        )}
      </div>
      {events.length === 0 ? (
        <div className="card p-6 text-center text-slate-500 text-sm">
          No events yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} teams={teams} />
          ))}
        </div>
      )}
    </div>
  );
}
