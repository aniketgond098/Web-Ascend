import React from 'react';

export const WebBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 select-none">
      {/* Dark Ambient Gradients: Deep nocturnal navy base with subtle red/blue cyber glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/[0.04] rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/[0.05] rounded-full blur-[160px]" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-cyan-500/[0.03] rounded-full blur-[120px]" />

      {/* Subtle Geometric Web Mesh Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="web-grid"
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
          >
            {/* Concentric octagons */}
            <path
              d="M70 10 L125 35 L125 105 L70 130 L15 105 L15 35 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.75"
            />
            <path
              d="M70 35 L105 50 L105 90 L70 105 L35 90 L35 50 Z"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.5"
            />
            {/* Radial vectors */}
            <line x1="70" y1="0" x2="70" y2="140" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="70" x2="140" y2="70" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="140" y2="140" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="140" y1="0" x2="0" y2="140" stroke="#94a3b8" strokeWidth="0.5" />
            {/* Center tick */}
            <circle cx="70" cy="70" r="1.5" fill="#ef4444" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#web-grid)" />
      </svg>

      {/* Subtle City-At-Night Skyline Silhouette (Bottom) */}
      <div className="absolute bottom-0 inset-x-0 h-40 opacity-[0.14] pointer-events-none">
        <svg
          viewBox="0 0 1200 160"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Distant building blocks */}
          <path
            d="
              M0 160 L0 110 L45 110 L45 75 L70 75 L70 95 L110 95 L110 40 L135 40 L135 15 L140 0 L145 15 L145 40 L170 40 L170 85 L210 85 L210 60 L245 60 L245 120
              L290 120 L290 50 L330 50 L330 30 L340 30 L340 10 L343 0 L346 10 L346 30 L365 30 L365 80 L400 80 L400 95 L445 95 L445 65 L480 65 L480 45 L520 45 L520 110
              L560 110 L560 35 L590 35 L590 70 L635 70 L635 25 L650 25 L652 5 L654 25 L680 25 L680 90 L720 90 L720 55 L760 55 L760 120
              L805 120 L805 40 L840 40 L840 75 L890 75 L890 30 L905 30 L908 10 L911 30 L940 30 L940 95 L985 95 L985 60 L1020 60 L1020 115
              L1070 115 L1070 50 L1110 50 L1110 80 L1155 80 L1155 45 L1200 45 L1200 160 Z
            "
            fill="#030712"
          />

          {/* Distant Windows & Beacon Lights */}
          {/* Antennas / Towers Red Beacons */}
          <circle cx="140" cy="5" r="2" fill="#EF4444" className="animate-pulse" />
          <circle cx="343" cy="8" r="2" fill="#EF4444" className="animate-pulse" />
          <circle cx="652" cy="7" r="2" fill="#3B82F6" className="animate-pulse" />
          <circle cx="908" cy="12" r="2" fill="#EF4444" className="animate-pulse" />

          {/* Micro golden/blue window clusters */}
          <rect x="52" y="85" width="3" height="4" fill="#FDE047" opacity="0.6" />
          <rect x="60" y="85" width="3" height="4" fill="#60A5FA" opacity="0.4" />
          <rect x="118" y="55" width="4" height="4" fill="#FDE047" opacity="0.5" />
          <rect x="126" y="55" width="4" height="4" fill="#FDE047" opacity="0.7" />
          <rect x="118" y="65" width="4" height="4" fill="#60A5FA" opacity="0.5" />
          <rect x="152" y="50" width="3" height="3" fill="#FDE047" opacity="0.6" />
          <rect x="300" y="65" width="4" height="4" fill="#FDE047" opacity="0.6" />
          <rect x="312" y="75" width="4" height="4" fill="#60A5FA" opacity="0.5" />
          <rect x="375" y="90" width="4" height="4" fill="#FDE047" opacity="0.4" />
          <rect x="492" y="55" width="4" height="4" fill="#FDE047" opacity="0.5" />
          <rect x="502" y="70" width="4" height="4" fill="#60A5FA" opacity="0.6" />
          <rect x="645" y="45" width="4" height="4" fill="#FDE047" opacity="0.5" />
          <rect x="660" y="45" width="4" height="4" fill="#FDE047" opacity="0.4" />
          <rect x="815" y="55" width="4" height="4" fill="#60A5FA" opacity="0.6" />
          <rect x="825" y="65" width="4" height="4" fill="#FDE047" opacity="0.5" />
          <rect x="918" y="45" width="4" height="4" fill="#FDE047" opacity="0.5" />
          <rect x="926" y="55" width="4" height="4" fill="#60A5FA" opacity="0.4" />
          <rect x="1080" y="65" width="4" height="4" fill="#FDE047" opacity="0.6" />
        </svg>

        {/* Skyline upward fade gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent" />
      </div>

      {/* Top Edge HUD Accent Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/25 to-transparent" />

      {/* Vignette to frame content cleanly */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,8,17,0.85)_100%)]" />
    </div>
  );
};

