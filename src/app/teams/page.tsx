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
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Rosters</h1>
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
            className="card overflow-hidden"
            style={{ borderTop: `4px solid ${t.color}` }}
          >
            <div className="p-4">
              <h2 className="text-lg font-bold" style={{ color: t.color }}>
                {t.emoji} {t.name}
              </h2>
              <p className="text-xs text-slate-500">{t.players.length} players</p>
              <ul className="mt-3 space-y-1 text-sm">
                {t.players.length === 0 ? (
                  <li className="text-slate-500">No players yet.</li>
                ) : (
                  t.players.map((p) => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span>{p.name}</span>
                      {p.user && (
                        <span className="text-xs text-slate-500">
                          @{p.user.name}
                        </span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
