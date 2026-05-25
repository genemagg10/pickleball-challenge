import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();
  const teams = await prisma.team.findMany({
    include: {
      players: {
        orderBy: { name: "asc" },
        include: {
          user: { select: { name: true } },
          _count: { select: { fans: true } },
        },
      },
      _count: { select: { fans: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-kicker">// Rosters</div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Teams</h1>
        </div>
        {session?.user?.isAdmin && (
          <Link href="/admin" className="btn-secondary">
            Manage in admin
          </Link>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {teams.map((t) => (
          <div
            key={t.id}
            className="card overflow-hidden bg-paper"
            style={{ borderTop: `4px solid ${t.color}` }}
          >
            <div className="p-4">
              <h2 className="text-lg font-bold" style={{ color: t.color }}>
                {t.emoji} {t.name}
              </h2>
              <p className="kicker mt-0.5">
                {t.players.length} player{t.players.length === 1 ? "" : "s"} ·{" "}
                {t._count.fans} fan{t._count.fans === 1 ? "" : "s"}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {t.players.length === 0 ? (
                  <li className="text-ink-soft">No players yet.</li>
                ) : (
                  t.players.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Link
                        href={`/players/${p.id}`}
                        className="text-ink font-medium hover:underline underline-offset-2"
                      >
                        {p.name}
                      </Link>
                      <span className="flex items-center gap-2 kicker">
                        {p.user && <span>@{p.user.name}</span>}
                        {p._count.fans > 0 && (
                          <span
                            title={`${p._count.fans} personal fan${
                              p._count.fans === 1 ? "" : "s"
                            }`}
                          >
                            🙌 {p._count.fans}
                          </span>
                        )}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {session?.user && (
        <p className="text-sm text-ink-soft">
          Pick who you&apos;re cheering for in{" "}
          <Link href="/me" className="text-ink underline underline-offset-2">
            your profile
          </Link>
          .
        </p>
      )}
    </div>
  );
}
