import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

function computeAcwr(history) {
  return history.map((session, i) => {
    const window = history.slice(0, i + 1);
    const last3 = window.slice(-3).map((s) => s.training_load);
    const last7 = window.slice(-7).map((s) => s.training_load);
    const roll3 = last3.reduce((a, b) => a + b, 0) / last3.length;
    const roll7 = last7.reduce((a, b) => a + b, 0) / last7.length;
    const acwr = roll7 !== 0 ? Math.min(roll3 / roll7, 2.5) : 0;
    return { session_id: session.session_id, acwr: parseFloat(acwr.toFixed(2)) };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      <p className="text-gray-400 mb-1">Session {label}</p>
      <p className="text-white">ACWR: {payload[0]?.value}</p>
    </div>
  );
};

export default function AcwrChart({ history }) {
  const data = computeAcwr(history);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <XAxis dataKey="session_id" stroke="#4B5563" tick={{ fontSize: 11, fill: "#6B7280" }} />
        <YAxis stroke="#4B5563" tick={{ fontSize: 11, fill: "#6B7280" }} domain={[0, 2.5]} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={1.0} stroke="#6B7280" strokeDasharray="3 3" />
        <ReferenceLine
          y={1.5}
          stroke="#F59E0B"
          strokeDasharray="3 3"
          label={{ value: "Risk Zone", fill: "#F59E0B", fontSize: 10 }}
        />
        <Area
          type="monotone"
          dataKey="acwr"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.1}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
