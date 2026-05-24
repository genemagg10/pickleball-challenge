import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RootingForm } from "./RootingForm";
import { FanBadge } from "@/components/FanBadge";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/me");

  const [me, teams, players] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        rootingForTeam: true,
        rootingForPlayer: { include: { team: true } },
        championPickTeam: true,
        player: { include: { team: true } },
      },
    }),
    prisma.team.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.player.findMany({
      include: { team: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!me) redirect("/login");

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold">Your profile</h1>
        <p className="text-sm text-slate-500">
          Signed in as <span className="font-medium">{me.name}</span> ({me.email})
        </p>
      </div>

      <section className="card p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Who are you rooting for?</h2>
          {me.rootingForTeam && (
            <FanBadge
              team={me.rootingForTeam}
              player={me.rootingForPlayer ?? null}
            />
          )}
        </div>
        <p className="text-xs text-slate-500">
          Shows up next to your name in comments so everyone knows whose side you&apos;re
          on. Optional — pick a favorite player too if you have one.
        </p>
        <RootingForm
          teams={teams}
          players={players}
          initialTeamId={me.rootingForTeamId}
          initialPlayerId={me.rootingForPlayerId}
        />
      </section>

      <section className="card p-4 space-y-2 text-sm">
        <h2 className="font-semibold">Your roster status</h2>
        {me.player ? (
          <p>
            You&apos;re on the roster as{" "}
            <span
              className="font-medium"
              style={{ color: me.player.team.color }}
            >
              {me.player.team.emoji} {me.player.name} ({me.player.team.name})
            </span>
            .
          </p>
        ) : (
          <p className="text-slate-600">
            You&apos;re not on a team roster — that&apos;s fine, you can still predict
            and comment. An admin can add you to a roster from{" "}
            <Link href="/admin" className="text-court underline">
              /admin
            </Link>
            .
          </p>
        )}
        {me.championPickTeam ? (
          <p>
            Overall championship pick:{" "}
            <span
              className="font-medium"
              style={{ color: me.championPickTeam.color }}
            >
              {me.championPickTeam.emoji} {me.championPickTeam.name}
            </span>
            . Change it on{" "}
            <Link href="/leaderboard" className="text-court underline">
              the leaderboard page
            </Link>
            .
          </p>
        ) : (
          <p className="text-slate-600">
            You haven&apos;t picked the overall champion yet.{" "}
            <Link href="/leaderboard" className="text-court underline">
              Pick now →
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
