import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CommentThread } from "@/components/CommentThread";

export const dynamic = "force-dynamic";

export default async function LoungePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const comments = await prisma.comment.findMany({
    where: { eventId: null },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          rootingForTeam: true,
          rootingForPlayer: { select: { id: true, name: true, teamId: true } },
          player: { select: { id: true, name: true } },
        },
      },
    },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">The Lounge</h1>
        <p className="text-sm text-slate-500">
          Trash talk, victory laps, weekend logistics. Be a champ.
        </p>
      </div>
      <CommentThread
        eventId={null}
        comments={comments.map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          user: c.user,
        }))}
        loggedIn={Boolean(userId)}
        currentUserId={userId}
      />
    </div>
  );
}
