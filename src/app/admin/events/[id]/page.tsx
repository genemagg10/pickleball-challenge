import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { EventEditor } from "./EventEditor";
import { MatchupEditor } from "./MatchupEditor";

export const dynamic = "force-dynamic";

export default async function AdminEventPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/");

  const [event, teams, players] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      include: {
        matchups: {
          orderBy: { sortOrder: "asc" },
          include: {
            teamA: true,
            teamB: true,
            participants: { include: { player: true } },
          },
        },
      },
    }),
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.player.findMany({
      include: { team: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-court hover:underline">
          ← Admin
        </Link>
        <h1 className="text-xl font-bold mt-2">Manage event</h1>
        <Link href={`/events/${event.id}`} className="text-sm text-court underline">
          View public page →
        </Link>
      </div>

      <section>
        <h2 className="font-semibold mb-2">Details & score</h2>
        <EventEditor event={event} teams={teams} />
      </section>

      <section>
        <h2 className="font-semibold mb-2">Matchups</h2>
        <MatchupEditor event={event} teams={teams} players={players} />
      </section>
    </div>
  );
}
