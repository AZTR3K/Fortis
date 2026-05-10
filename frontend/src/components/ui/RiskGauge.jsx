const RADIUS = 90;
const CIRCUMFERENCE = Math.PI * RADIUS;

const colorMap = {
  0: "#10B981",
  1: "#EF4444",
};

export default function RiskGauge({ confidence, riskClass, label }) {
  const color = colorMap[riskClass] ?? colorMap[0];
  const percentage = Math.round(confidence * 100);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d="M 10 100 A 90 90 0 0 1 190 100"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - confidence)}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
        {/* Percentage */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
        >
          {percentage}%
        </text>
      </svg>
      <p className="text-xs text-gray-500 uppercase tracking-wider -mt-2">{label}</p>
    </div>
  );
}
