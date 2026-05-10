import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAthlete, getAthleteHistory, postPredict } from "../api/client";
import Spinner from "../components/ui/Spinner";
import RiskBadge from "../components/ui/RiskBadge";
import StatCard from "../components/ui/StatCard";
import RiskGauge from "../components/ui/RiskGauge";
import SessionTimeline from "../components/charts/SessionTimeline";
import AcwrChart from "../components/charts/AcwrChart";

export default function AthleteProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    Promise.all([getAthlete(id), getAthleteHistory(id)]).then(([athleteData, historyData]) => {
      setAthlete(athleteData);
      setHistory(historyData);
      setLoading(false);

      if (historyData.length > 0) {
        const last = historyData[historyData.length - 1];
        postPredict({
          athlete_id: parseInt(id),
          session_data: {
            training_load: last.training_load,
            fatigue_index: last.fatigue_index,
            recovery_score: last.recovery_score,
            sport_type: athleteData.sport_type,
            gender: athleteData.gender,
            age: athleteData.age,
          },
          history: historyData.slice(-7).map((s) => ({
            training_load: s.training_load,
            fatigue_index: s.fatigue_index,
            recovery_score: s.recovery_score,
            sport_type: athleteData.sport_type,
            gender: athleteData.gender,
          })),
        }).then(setPrediction);
      }
    });
  }, [id]);

  if (loading) return <Spinner />;

  const latest = history[history.length - 1];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            ← Back
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">Athlete #{athlete.athlete_id}</h1>
              <RiskBadge riskClass={athlete.latest_risk_class} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {athlete.sport_type} · {athlete.gender} · {athlete.age} yrs
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/athlete/${id}/predict`)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          Run New Prediction →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Recovery" value={latest.recovery_score.toFixed(1)} unit="%" mono={true} />
        <StatCard label="Fatigue Index" value={latest.fatigue_index.toFixed(1)} mono={true} />
        <StatCard
          label="Training Load"
          value={latest.training_load.toFixed(1)}
          unit="AU"
          mono={true}
        />
        <StatCard label="Sessions Logged" value={history.length} mono={true} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Charts */}
        <div className="col-span-2 flex flex-col gap-6">
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Session Timeline</p>
            <SessionTimeline history={history} />
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">ACWR Trend</p>
            <AcwrChart history={history} />
          </div>
        </div>

        {/* Right — Gauge */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl border p-6 flex flex-col items-center"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Latest Risk</p>
            <RiskGauge
              confidence={
                prediction
                  ? prediction.risk_class === 1
                    ? prediction.confidence["Injured"]
                    : prediction.confidence["Healthy"]
                  : 0.3
              }
              riskClass={athlete.latest_risk_class}
              label={athlete.latest_risk_class === 1 ? "Injury Risk" : "Low Risk"}
            />
          </div>

          {prediction && (
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                Top Risk Factors
              </p>
              {prediction.top_risk_features.map((f, i) => (
                <div key={f} className="flex items-center gap-3 mb-2">
                  <div className="h-1.5 rounded-full bg-blue-500/30 flex-1">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${100 - i * 25}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-40 text-right">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
