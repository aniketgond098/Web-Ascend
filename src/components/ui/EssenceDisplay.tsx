import React from 'react';

interface EssenceDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const EssenceDisplay: React.FC<EssenceDisplayProps> = ({
  amount,
  size = 'md',
  showLabel = true,
  className = '',
  interactive = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const numberSizes = {
    sm: 'text-xs',
    md: 'text-sm font-bold',
    lg: 'text-lg font-bold',
  };

  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-lg bg-[#0e1628]/90 border border-[#1e293b]
        shadow-[0_0_12px_rgba(56,189,248,0.1)] transition-all select-none
        ${interactive ? 'cursor-pointer hover:border-[#38bdf8]/60 active:scale-95' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {/* Futuristic diamond / essence crystal glyph */}
      <span className="text-[#38bdf8] drop-shadow-[0_0_6px_rgba(56,189,248,0.8)] text-base leading-none">
        ◈
      </span>
      <div className="flex items-baseline gap-1 font-mono">
        <span className={`text-white tracking-wide ${numberSizes[size]}`}>
          {amount.toLocaleString()}
        </span>
        {showLabel && (
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            ESSENCE
          </span>
        )}
      </div>
    </div>
  );
};
