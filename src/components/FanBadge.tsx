type Team = { id: string; name: string; color: string; emoji: string | null };
type Player = { id: string; name: string; teamId: string };

type Props = {
  team: Team | null;
  player?: Player | null;
  size?: "sm" | "xs";
};

export function FanBadge({ team, player, size = "sm" }: Props) {
  if (!team) return null;
  // Defensively hide stale player picks if they've moved teams.
  const showPlayer = player && player.teamId === team.id;
  const padding = size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`badge ${padding} font-medium`}
      style={{ backgroundColor: team.color + "22", color: team.color }}
      title={
        showPlayer
          ? `Rooting for ${player!.name} (${team.name})`
          : `Rooting for ${team.name}`
      }
    >
      <span aria-hidden>{team.emoji ?? "▲"}</span>
      <span>{team.name}</span>
      {showPlayer && <span className="opacity-80">· #{player!.name}</span>}
    </span>
  );
}
