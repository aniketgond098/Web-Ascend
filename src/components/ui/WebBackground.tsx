import React from 'react';

export const WebBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20 select-none">
      {/* Dark Ambient Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#e62b3a]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#0284c7]/5 rounded-full blur-[140px]" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-[#38bdf8]/4 rounded-full blur-[100px]" />

      {/* Subtle Geometric Web Mesh Background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="web-grid"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Concentric octagons */}
            <path
              d="M60 10 L110 30 L110 90 L60 110 L10 90 L10 30 Z"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.75"
            />
            <path
              d="M60 30 L90 42 L90 78 L60 90 L30 78 L30 42 Z"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.5"
            />
            {/* Radial vectors */}
            <line x1="60" y1="0" x2="60" y2="120" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="60" x2="120" y2="60" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="120" y2="120" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="120" y1="0" x2="0" y2="120" stroke="#94a3b8" strokeWidth="0.5" />
            {/* Center tick */}
            <circle cx="60" cy="60" r="1.5" fill="#ff334b" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#web-grid)" />
      </svg>

      {/* Top Edge HUD Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/20 to-transparent" />
      
      {/* Subtle Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,10,16,0.85)_100%)]" />
    </div>
  );
};
