import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAthletes } from "../api/client";
import RiskBadge from "../components/ui/RiskBadge";
import Spinner from "../components/ui/Spinner";

export default function Dashboard() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSport, setFilterSport] = useState("");
  const [filterRisk, setFilterRisk] = useState("");

  useEffect(() => {
    getAthletes()
      .then((data) => {
        setAthletes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = athletes
    .filter((a) => search === "" || String(a.athlete_id).includes(search))
    .filter((a) => filterSport === "" || a.sport_type === filterSport)
    .filter((a) => filterRisk === "" || String(a.latest_risk_class) === filterRisk);

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Squad Overview</h1>
          <p className="text-sm text-gray-500 mt-1">{athletes.length} athletes</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-blue-500/50"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          />
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-gray-300 border focus:outline-none"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <option value="">All Sports</option>
            <option>Soccer</option>
            <option>Basketball</option>
            <option>Track</option>
            <option>Other</option>
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-gray-300 border focus:outline-none"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <option value="">All Risk Levels</option>
            <option value="0">Healthy</option>
            <option value="1">Injured</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
          No athletes match filters
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <Link
              key={a.athlete_id}
              to={`/athlete/${a.athlete_id}`}
              className="rounded-xl border p-4 hover:border-blue-500/30 hover:bg-white/[0.02] transition-all cursor-pointer block"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Athlete #{a.athlete_id}</span>
                <RiskBadge riskClass={a.latest_risk_class} />
              </div>
              <p className="text-white text-sm font-medium mb-1">{a.sport_type}</p>
              <p className="text-gray-500 text-xs">
                {a.gender} · {a.age} yrs
              </p>
              <p className="text-gray-600 text-xs font-mono mt-3">Session {a.latest_session_id}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
