import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PollPerformanceChartProps {
  pollId: string;
  options: { id: string; label: string }[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6"];

const PollPerformanceChart = ({ pollId, options }: PollPerformanceChartProps) => {
  const { data: snapshots, isLoading } = useQuery({
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

  if (isLoading) return <p className="text-xs text-muted-foreground py-4">Loading chart data...</p>;
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">Not enough data for a probability chart yet.</p>
      </div>
    );
  }

  // Group by snapshot_at timestamp
  const timeMap = new Map<string, Record<string, number>>();
  snapshots.forEach((s) => {
    const t = s.snapshot_at || "";
    if (!timeMap.has(t)) timeMap.set(t, { time: new Date(t).getTime() } as any);
    const opt = options.find((o) => o.id === s.option_id);
    if (opt) {
      timeMap.get(t)![opt.label] = Math.round(s.probability * 100);
    }
  });

  const chartData = Array.from(timeMap.values()).sort((a, b) => (a as any).time - (b as any).time);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Probability Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v) => new Date(v).toLocaleDateString([], { month: "short", day: "numeric" })}
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            width={40}
          />
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            labelFormatter={(v) => new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {options.map((opt, i) => (
            <Line
              key={opt.id}
              type="monotone"
              dataKey={opt.label}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PollPerformanceChart;
