"use client";

export default function Speedometer({ value = 0 }) {
  // Normalize value to 0-100 range
  const normalizedValue = Math.min(Math.max(value * 100, 0), 100);
  
  // Convert 0-100 to angle: 0 = -90° (left), 100 = 90° (right)
  const angle = (normalizedValue / 100) * 180 - 90;
  
  // Determine color based on value (0-33 green, 33-67 amber, 67-100 red)
  let color = "text-emerald-300";
  if (normalizedValue > 67) {
    color = "text-rose-300";
  } else if (normalizedValue > 33) {
    color = "text-amber-300";
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Speedometer - larger */}
      <div className="relative w-40 h-20">
        {/* SVG Semicircle Background */}
        <svg
          viewBox="0 0 200 120"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(16, 185, 129)" /> {/* emerald */}
              <stop offset="50%" stopColor="rgb(245, 158, 11)" /> {/* amber */}
              <stop offset="100%" stopColor="rgb(244, 63, 94)" /> {/* rose */}
            </linearGradient>
          </defs>

          {/* Background semicircle */}
          <path
            d="M 10 120 A 90 90 0 0 1 190 120"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Colored semicircle */}
          <path
            d="M 10 120 A 90 90 0 0 1 190 120"
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(normalizedValue / 100) * 283} 283`}
          />

          {/* Center pivot point */}
          <circle cx="100" cy="120" r="4" fill="white" />

          {/* Needle/Arrow (rotated based on value) */}
          <g
            transform={`rotate(${angle} 100 120)`}
            style={{ transformOrigin: "100px 120px" }}
          >
            {/* Needle line - thicker */}
            <line
              x1="100"
              y1="120"
              x2="100"
              y2="25"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Larger arrowhead */}
            <polygon
              points="100,25 92,45 108,45"
              fill="white"
            />
          </g>

          {/* Tick marks and labels */}
          <g fontSize="10" fill="rgba(255, 255, 255, 0.5)" textAnchor="middle">
            {/* 0% */}
            <text x="20" y="115" fontSize="9" fill="rgba(255, 255, 255, 0.6)">
              0%
            </text>
            {/* 50% */}
            <text x="100" y="105" fontSize="9" fill="rgba(255, 255, 255, 0.6)">
              50%
            </text>
            {/* 100% */}
            <text x="180" y="115" fontSize="9" fill="rgba(255, 255, 255, 0.6)">
              100%
            </text>
          </g>
        </svg>
      </div>

      {/* Compact Value Display */}
      <p className={`text-2xl font-bold ${color}`}>
        {Math.round(normalizedValue)}%
      </p>
    </div>
  );
}
