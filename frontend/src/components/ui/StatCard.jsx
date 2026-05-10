export default function StatCard({ label, value, unit, mono }) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-semibold text-white ${mono ? "font-mono" : ""}`}>
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
