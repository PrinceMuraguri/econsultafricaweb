import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { PollOption } from "@/hooks/use-polls";

interface Props {
  pollId: string;
  options: PollOption[];
}

type TimeRange = "1D" | "1W" | "1M" | "ALL";

const rangeMs: Record<TimeRange, number> = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  ALL: 0,
};

const PollProbabilityChart = ({ pollId, options }: Props) => {
  const [range, setRange] = useState<TimeRange>("ALL");

  const { data: snapshots } = useQuery({
    queryKey: ["poll-snapshots", pollId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_snapshots")
        .select("*")
        .eq("poll_id", pollId)
        .order("snapshot_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const optionMap = useMemo(() => {
    const m: Record<string, string> = {};
    options.forEach((o) => (m[o.id] = o.label));
    return m;
  }, [options]);

  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    const cutoff = range === "ALL" ? 0 : Date.now() - rangeMs[range];
    const filtered = snapshots.filter(
      (s) => new Date(s.snapshot_at).getTime() >= cutoff
    );

    const grouped: Record<string, Record<string, number>> = {};
    filtered.forEach((s) => {
      const t = s.snapshot_at;
      if (!grouped[t]) grouped[t] = {};
      const label = optionMap[s.option_id] || s.option_id;
      grouped[t][label] = Math.round(Number(s.probability) * 100);
    });

    return Object.entries(grouped)
      .map(([time, vals]) => ({
        time: new Date(time).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        ...vals,
      }))
      .sort(
        (a, b) =>
          new Date(a.time).getTime() - new Date(b.time).getTime()
      );
  }, [snapshots, range, optionMap]);

  // Derive current probability from live data
  const totalVotes = options.reduce((s, o) => s + o.total_votes_count, 0);
  const currentData = useMemo(() => {
    if (totalVotes === 0) return null;
    const point: Record<string, number | string> = { time: "Now" };
    options.forEach((o) => {
      point[o.label] = Math.round((o.total_votes_count / totalVotes) * 100);
    });
    return point;
  }, [options, totalVotes]);

  const displayData = useMemo(() => {
    const d = [...chartData];
    if (currentData) d.push(currentData as any);
    return d;
  }, [chartData, currentData]);

  const optionLabels = options.map((o) => o.label);
  const colors = ["hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(226, 55%, 49%)", "hsl(13, 88%, 63%)"];

  if (displayData.length < 2) {
    return (
      <div className="border border-border rounded-lg p-6 text-center bg-card">
        <p className="text-sm text-muted-foreground">
          Probability history will appear as votes accumulate.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Probability History</h3>
        <div className="flex gap-1">
          {(["1D", "1W", "1M", "ALL"] as TimeRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={displayData}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={35}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${value}%`]}
          />
          {optionLabels.map((label, i) => (
            <Area
              key={label}
              type="monotone"
              dataKey={label}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.1}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PollProbabilityChart;
