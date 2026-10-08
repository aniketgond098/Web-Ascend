import React from 'react';

interface WebbyAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  state?: 'idle' | 'thinking' | 'happy' | 'speaking';
  className?: string;
  showBadge?: boolean;
}

export const WebbyAvatar: React.FC<WebbyAvatarProps> = ({
  size = 'md',
  state = 'idle',
  className = '',
  showBadge = true,
}) => {
  // Dimensions
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const eyeSizeMap = {
    sm: 'w-1.5 h-2',
    md: 'w-2.5 h-3.5',
    lg: 'w-3.5 h-5',
    xl: 'w-5 h-7',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer Hologram Pulse Ring */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/30 to-red-500/20 blur-md transition-all duration-500 ${
          state === 'thinking'
            ? 'animate-pulse scale-125 opacity-90'
            : state === 'happy'
            ? 'scale-115 opacity-80'
            : 'opacity-50'
        }`}
      />

      {/* Cybernetic Mascot Chassis */}
      <div
        className={`relative ${sizeMap[size]} rounded-2xl bg-gradient-to-b from-[#111A2E] to-[#080D1A] border-2 ${
          state === 'thinking'
            ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
            : state === 'happy'
            ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
            : 'border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
        } flex items-center justify-center overflow-hidden transition-all duration-300`}
      >
        {/* Spider Web Visor Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
        >
          <path d="M50 0 L50 100" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M0 50 L100 50" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M15 15 L85 85" stroke="#38bdf8" strokeWidth="0.8" />
          <path d="M15 85 L85 15" stroke="#38bdf8" strokeWidth="0.8" />
          <polygon
            points="50,20 80,50 50,80 20,50"
            stroke="#ef4444"
            strokeWidth="0.9"
            fill="none"
          />
        </svg>

        {/* Cute Expressive Digital Eyes */}
        <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          {/* Left Eye */}
          <div
            className={`${eyeSizeMap[size]} rounded-full transition-all duration-300 ${
              state === 'thinking'
                ? 'bg-cyan-300 animate-bounce shadow-[0_0_10px_#22d3ee]'
                : state === 'happy'
                ? 'bg-amber-300 h-2 rounded-t-full shadow-[0_0_10px_#fbbf24] -rotate-6'
                : 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
            }`}
          />
          {/* Center Micro Spider Emblem */}
          <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444] animate-pulse" />
          {/* Right Eye */}
          <div
            className={`${eyeSizeMap[size]} rounded-full transition-all duration-300 ${
              state === 'thinking'
                ? 'bg-cyan-300 animate-bounce [animation-delay:150ms] shadow-[0_0_10px_#22d3ee]'
                : state === 'happy'
                ? 'bg-amber-300 h-2 rounded-t-full shadow-[0_0_10px_#fbbf24] rotate-6'
                : 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]'
            }`}
          />
        </div>

        {/* Cute Cheeks */}
        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1 rounded-full bg-red-400/40 blur-[0.5px]" />
        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1 rounded-full bg-red-400/40 blur-[0.5px]" />
      </div>

      {/* Online Status Orb Badge */}
      {showBadge && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border border-[#05070A] shadow-[0_0_8px_#22d3ee]" />
        </span>
      )}
    </div>
  );
};
