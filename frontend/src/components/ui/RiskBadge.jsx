const config = {
  0: { label: "Healthy", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  1: { label: "Injured", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

export default function RiskBadge({ riskClass }) {
  const c = config[riskClass] ?? config[0];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
