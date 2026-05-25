"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const inkSoft = "#525252";

export function MatchupsByEventBar({
  data,
  teams,
}: {
  data: Record<string, string | number>[];
  teams: { name: string; color: string }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, bottom: 8, left: 0 }}>
          <XAxis
            dataKey="event"
            tick={{ fontSize: 10, fill: inkSoft, fontFamily: "var(--font-mono)" }}
            interval={0}
            tickFormatter={(v: string) =>
              v.length > 14 ? v.slice(0, 13) + "…" : v
            }
            stroke="rgba(15,15,15,0.15)"
          />
          <YAxis
            tick={{ fontSize: 10, fill: inkSoft, fontFamily: "var(--font-mono)" }}
            stroke="rgba(15,15,15,0.15)"
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#f4efe5",
              border: "1px solid rgba(15,15,15,0.15)",
              borderRadius: 8,
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(15,15,15,0.04)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
          />
          {teams.map((t) => (
            <Bar
              key={t.name}
              dataKey={t.name}
              fill={t.color}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
