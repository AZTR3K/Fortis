import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAthleteHistory, postPredict } from "../api/client";
import RiskGauge from "../components/ui/RiskGauge";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none";
const labelClass = "block text-xs text-gray-500 mb-1";

function FieldGroup({ title, children }) {
  return (
    <div
      className="rounded-xl border p-4 mb-4"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">{title}</p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function NumericInput({ label, name, value, onChange }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="number"
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className={inputClass}
      />
    </div>
  );
}

export default function Predict() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ sport_type: "Soccer", gender: "Male" });
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAthleteHistory(id)
      .then((data) => {
        setHistory(data);
        if (data.length > 0) {
          const last = data[data.length - 1];
          setFormData((prev) => ({
            ...prev,
            training_load: last.training_load.toFixed(1),
            fatigue_index: last.fatigue_index.toFixed(1),
            recovery_score: last.recovery_score.toFixed(1),
          }));
        }
      })
      .catch(() => {});
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : isNaN(parseFloat(value)) ? value : parseFloat(value),
    }));
  }

  function handleSubmit() {
    setLoading(true);
    const payload = {
      athlete_id: parseInt(id),
      session_data: formData,
      history: history.slice(-7).map((s) => ({
        training_load: s.training_load,
        fatigue_index: s.fatigue_index,
        recovery_score: s.recovery_score,
        sport_type: formData.sport_type,
        gender: formData.gender,
      })),
    };
    postPredict(payload)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const confidence = result
    ? result.risk_class === 1
      ? result.confidence["Injured"]
      : result.confidence["Healthy"]
    : 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Run Prediction</h1>
          <p className="text-sm text-gray-500 mt-0.5">Athlete #{id}</p>
        </div>
      </div>

      <div className={`grid gap-8 ${result ? "grid-cols-2" : "grid-cols-1 max-w-3xl"}`}>
        {/* Form */}
        <div>
          <FieldGroup title="Physiological">
            <NumericInput
              label="Heart Rate (bpm)"
              name="heart_rate"
              value={formData.heart_rate}
              onChange={handleChange}
            />
            <NumericInput
              label="Body Temperature (°C)"
              name="body_temperature"
              value={formData.body_temperature}
              onChange={handleChange}
            />
            <NumericInput
              label="Hydration Level (%)"
              name="hydration_level"
              value={formData.hydration_level}
              onChange={handleChange}
            />
            <NumericInput
              label="Sleep Quality (0–10)"
              name="sleep_quality"
              value={formData.sleep_quality}
              onChange={handleChange}
            />
            <NumericInput
              label="Recovery Score (%)"
              name="recovery_score"
              value={formData.recovery_score}
              onChange={handleChange}
            />
            <NumericInput
              label="Stress Level"
              name="stress_level"
              value={formData.stress_level}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup title="Biomechanical">
            <NumericInput
              label="Muscle Activity (EMG)"
              name="muscle_activity"
              value={formData.muscle_activity}
              onChange={handleChange}
            />
            <NumericInput
              label="Joint Angles (°)"
              name="joint_angles"
              value={formData.joint_angles}
              onChange={handleChange}
            />
            <NumericInput
              label="Gait Speed (m/s)"
              name="gait_speed"
              value={formData.gait_speed}
              onChange={handleChange}
            />
            <NumericInput
              label="Cadence (steps/min)"
              name="cadence"
              value={formData.cadence}
              onChange={handleChange}
            />
            <NumericInput
              label="Step Count"
              name="step_count"
              value={formData.step_count}
              onChange={handleChange}
            />
            <NumericInput
              label="Jump Height (m)"
              name="jump_height"
              value={formData.jump_height}
              onChange={handleChange}
            />
            <NumericInput
              label="Ground Reaction Force (N)"
              name="ground_reaction_force"
              value={formData.ground_reaction_force}
              onChange={handleChange}
            />
            <NumericInput
              label="Range of Motion (°)"
              name="range_of_motion"
              value={formData.range_of_motion}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup title="Environmental">
            <NumericInput
              label="Ambient Temp (°C)"
              name="ambient_temperature"
              value={formData.ambient_temperature}
              onChange={handleChange}
            />
            <NumericInput
              label="Humidity (%)"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
            />
            <NumericInput
              label="Altitude (m)"
              name="altitude"
              value={formData.altitude}
              onChange={handleChange}
            />
            <NumericInput
              label="Playing Surface (0–4)"
              name="playing_surface"
              value={formData.playing_surface}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup title="Workload">
            <NumericInput
              label="Training Intensity"
              name="training_intensity"
              value={formData.training_intensity}
              onChange={handleChange}
            />
            <NumericInput
              label="Training Duration (min)"
              name="training_duration"
              value={formData.training_duration}
              onChange={handleChange}
            />
            <NumericInput
              label="Training Load (AU)"
              name="training_load"
              value={formData.training_load}
              onChange={handleChange}
            />
            <NumericInput
              label="Fatigue Index"
              name="fatigue_index"
              value={formData.fatigue_index}
              onChange={handleChange}
            />
          </FieldGroup>

          <FieldGroup title="Athlete Profile">
            <div>
              <label className={labelClass}>Sport Type</label>
              <select
                name="sport_type"
                value={formData.sport_type}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Soccer</option>
                <option>Basketball</option>
                <option>Track</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <NumericInput
              label="Age (years)"
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
            <NumericInput
              label="BMI (kg/m²)"
              name="bmi"
              value={formData.bmi}
              onChange={handleChange}
            />
          </FieldGroup>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />{" "}
                Running...
              </>
            ) : (
              "Run Prediction"
            )}
          </button>
        </div>

        {/* Result panel */}
        {result && (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl border p-6 flex flex-col items-center"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                Prediction Result
              </p>
              <RiskGauge
                confidence={confidence}
                riskClass={result.risk_class}
                label={result.risk_label}
              />
              <div className="w-full mt-6 flex flex-col gap-2">
                {Object.entries(result.confidence).map(([label, prob]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-mono">{(prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${prob * 100}%`,
                          backgroundColor:
                            label === "Injured" ? "var(--injured)" : "var(--healthy)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                Top Risk Factors
              </p>
              {result.top_risk_features.map((f, i) => (
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

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ACWR</p>
              <p className="text-2xl font-mono font-semibold text-white">
                {result.acwr.toFixed(2)}
              </p>
            </div>

            {result.risk_class === 1 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-red-400 font-medium text-sm">⚠ Elevated Injury Risk Detected</p>
                <p className="text-gray-400 text-xs mt-1">
                  Recommend reducing training load for next 2–3 sessions and monitoring recovery
                  closely.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
