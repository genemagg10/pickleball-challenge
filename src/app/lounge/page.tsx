import { auth } from "@/lib/auth";
import { CommentThread } from "@/components/CommentThread";
import { getLoungeFeed } from "@/lib/loungeFeed";

export const dynamic = "force-dynamic";

export default async function LoungePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const items = await getLoungeFeed({ take: 100 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">The Lounge</h1>
        <p className="text-sm text-slate-500">
          Trash talk, victory laps, weekend logistics. All event chatter and
          results land here too.
        </p>
      </div>
      <CommentThread
        eventId={null}
        items={items}
        loggedIn={Boolean(userId)}
        currentUserId={userId}
      />
    </div>
  );
}
