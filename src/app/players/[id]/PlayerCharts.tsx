"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const ink = "#0f0f0f";
const inkSoft = "#525252";
const positive = "#3d7a5f"; // cactus
const negative = "#c4682c"; // sun (terracotta)
const clay = "#7d5e5f"; // clay
const neutral = "#9fb8a8"; // sage

export function WinLossDonut({
  wins,
  losses,
  pending,
  teamColor,
}: {
  wins: number;
  losses: number;
  pending: number;
  teamColor: string;
}) {
  const data = [
    { name: "Won", value: wins, color: teamColor },
    { name: "Lost", value: losses, color: negative },
    { name: "Pending", value: pending, color: neutral },
  ].filter((d) => d.value > 0);

  const total = wins + losses + pending;
  const settled = wins + losses;
  const rate = settled === 0 ? null : Math.round((wins / settled) * 100);

  if (total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-ink-soft">
        No matchups yet.
      </div>
    );
  }

  return (
    <div className="relative h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#f4efe5",
              border: "1px solid rgba(15,15,15,0.15)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-bold text-2xl tabular-nums" style={{ color: ink }}>
          {rate == null ? "—" : `${rate}%`}
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: inkSoft }}
        >
          Win rate
        </div>
      </div>
    </div>
  );
}

export function PointsByEventBar({
  data,
  teamColor,
}: {
  data: { event: string; points: number; lost: number }[];
  teamColor: string;
}) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-ink-soft">
        No event participation yet.
      </div>
    );
  }
  const chartData = data.map((d) => ({
    event: d.event,
    points: d.points,
    lost: -d.lost,
  }));
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
          stackOffset="sign"
        >
          <XAxis
            dataKey="event"
            tick={{ fontSize: 10, fill: inkSoft, fontFamily: "var(--font-mono)" }}
            interval={0}
            tickFormatter={(v: string) =>
              v.length > 12 ? v.slice(0, 11) + "…" : v
            }
            stroke="rgba(15,15,15,0.15)"
          />
          <YAxis
            tick={{ fontSize: 10, fill: inkSoft, fontFamily: "var(--font-mono)" }}
            stroke="rgba(15,15,15,0.15)"
            width={28}
            allowDecimals={false}
            tickFormatter={(v: number) => String(Math.abs(v))}
          />
          <ReferenceLine y={0} stroke="rgba(15,15,15,0.35)" />
          <Tooltip
            contentStyle={{
              background: "#f4efe5",
              border: "1px solid rgba(15,15,15,0.15)",
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(15,15,15,0.04)" }}
            formatter={(v, name) => [Math.abs(Number(v)), name]}
          />
          <Bar
            dataKey="points"
            name="Pts won"
            fill={teamColor}
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="lost"
            name="Pts conceded"
            fill={negative}
            radius={[0, 0, 3, 3]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PickAccuracyDonut({
  correct,
  wrong,
}: {
  correct: number;
  wrong: number;
}) {
  const total = correct + wrong;
  const rate = total === 0 ? null : Math.round((correct / total) * 100);
  if (total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-ink-soft">
        No settled picks yet.
      </div>
    );
  }
  const data = [
    { name: "Correct", value: correct, color: positive },
    { name: "Wrong", value: wrong, color: clay },
  ];
  return (
    <div className="relative h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#f4efe5",
              border: "1px solid rgba(15,15,15,0.15)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-bold text-2xl tabular-nums" style={{ color: ink }}>
          {rate}%
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-wider"
          style={{ color: inkSoft }}
        >
          {correct}/{total} correct
        </div>
      </div>
    </div>
  );
}
