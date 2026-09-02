import React from 'react';
import { getLevelProgress } from '../../config/progression';
import { ProgressBar } from './ProgressBar';

interface XPDisplayProps {
  totalXP: number;
  showLevel?: boolean;
  className?: string;
  compact?: boolean;
}

export const XPDisplay: React.FC<XPDisplayProps> = ({
  totalXP,
  showLevel = true,
  className = '',
  compact = false,
}) => {
  const { level, currentLevelXP, nextLevelXP, progressPercent } = getLevelProgress(totalXP);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 font-mono text-xs ${className}`}>
        {showLevel && (
          <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-[#38bdf8] font-bold">
            LVL {level}
          </span>
        )}
        <div className="w-24">
          <ProgressBar progress={progressPercent} color="blue" height="xs" />
        </div>
        <span className="text-slate-400 text-[11px]">
          {currentLevelXP}/{nextLevelXP} XP
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-baseline font-mono">
        <div className="flex items-center gap-2">
          {showLevel && (
            <span className="text-xs font-bold text-[#38bdf8] tracking-wider uppercase">
              LEVEL {level}
            </span>
          )}
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            XP PROGRESS
          </span>
        </div>
        <div className="text-xs text-slate-200">
          <span className="font-bold text-white">{currentLevelXP.toLocaleString()}</span>
          <span className="text-slate-500"> / {nextLevelXP.toLocaleString()} XP</span>
        </div>
      </div>

      <ProgressBar
        progress={progressPercent}
        color="blue"
        height="sm"
      />
    </div>
  );
};
