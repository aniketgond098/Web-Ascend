import React from 'react';
import { RankTier } from '../../types';
import { RANK_CONFIG } from '../../config/progression';

interface RankBadgeProps {
  rank: RankTier;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  className?: string;
  glow?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  rank,
  size = 'md',
  showLabel = false,
  className = '',
  glow = true,
}) => {
  const config = RANK_CONFIG[rank] || RANK_CONFIG.E;

  const sizeStyles = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg font-bold',
    hero: 'w-20 h-20 text-3xl font-extrabold',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`relative flex items-center justify-center font-['Chakra_Petch'] rounded-lg font-mono uppercase tracking-wider select-none transition-transform ${sizeStyles[size]}`}
        style={{
          backgroundColor: '#0a0f1d',
          border: `1.5px solid ${config.color}`,
          boxShadow: glow ? `0 0 16px ${config.glowColor}` : undefined,
          color: config.color,
        }}
      >
        {/* Subtle corner ticks */}
        <div
          className="absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <div
          className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        
        <span>{rank}</span>
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-200 tracking-wide">
            {config.name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">
            {config.codename}
          </span>
        </div>
      )}
    </div>
  );
};
