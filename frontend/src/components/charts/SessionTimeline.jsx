import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <p className="text-gray-400 mb-1">Session {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)}
        </p>
      ))}
    </div>
  );
};

export default function SessionTimeline({ history }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={history} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="session_id" stroke="#4B5563" tick={{ fontSize: 11, fill: "#6B7280" }} />
        <YAxis yAxisId="left" stroke="#4B5563" tick={{ fontSize: 11, fill: "#6B7280" }} />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#4B5563"
          tick={{ fontSize: 11, fill: "#6B7280" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "11px", color: "#6B7280" }} />
        {history
          .filter((s) => s.risk_class === 1)
          .map((s) => (
            <ReferenceLine
              key={s.session_id}
              x={s.session_id}
              yAxisId="left"
              stroke="#EF4444"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
          ))}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="training_load"
          stroke="#3B82F6"
          dot={false}
          strokeWidth={1.5}
          name="Training Load"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="fatigue_index"
          stroke="#F59E0B"
          dot={false}
          strokeWidth={1.5}
          name="Fatigue"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="recovery_score"
          stroke="#10B981"
          dot={false}
          strokeWidth={1.5}
          name="Recovery"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
