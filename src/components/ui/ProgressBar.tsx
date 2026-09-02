import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'blue' | 'crimson' | 'emerald' | 'amber' | 'purple';
  height?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  subLabel?: string;
  className?: string;
  segmented?: boolean;
  segmentsCount?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  height = 'sm',
  showLabel = false,
  label,
  subLabel,
  className = '',
  segmented = false,
  segmentsCount = 10,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const heightClasses = {
    xs: 'h-1.5',
    sm: 'h-2.5',
    md: 'h-3.5',
    lg: 'h-5',
  };

  const colorGradients = {
    blue: 'from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]',
    crimson: 'from-[#b91c1c] via-[#dc2626] to-[#ff334b]',
    emerald: 'from-[#059669] via-[#10b981] to-[#34d399]',
    amber: 'from-[#d97706] via-[#f59e0b] to-[#fbbf24]',
    purple: 'from-[#7e22ce] via-[#9333ea] to-[#c084fc]',
  };

  const glowColors = {
    blue: 'shadow-[0_0_12px_rgba(56,189,248,0.5)]',
    crimson: 'shadow-[0_0_12px_rgba(255,51,75,0.5)]',
    emerald: 'shadow-[0_0_12px_rgba(52,211,153,0.5)]',
    amber: 'shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    purple: 'shadow-[0_0_12px_rgba(192,132,252,0.5)]',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label || subLabel) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
          <span className="text-slate-400 uppercase tracking-wider">{label}</span>
          <span className="text-slate-200 font-semibold">{subLabel || `${clamped}%`}</span>
        </div>
      )}

      {segmented ? (
        <div className={`flex gap-1 ${heightClasses[height]}`}>
          {Array.from({ length: segmentsCount }).map((_, i) => {
            const segmentThreshold = ((i + 1) / segmentsCount) * 100;
            const isFilled = clamped >= segmentThreshold;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all duration-300 ${
                  isFilled
                    ? `bg-gradient-to-r ${colorGradients[color]} ${glowColors[color]}`
                    : 'bg-[#1e293b]/70'
                }`}
              />
            );
          })}
        </div>
      ) : (
        <div className={`w-full bg-[#131b2e] rounded-full overflow-hidden p-[1px] border border-slate-800/80 ${heightClasses[height]}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colorGradients[color]} transition-all duration-500 ease-out relative`}
            style={{ width: `${clamped}%` }}
          >
            {clamped > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px] rounded-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
