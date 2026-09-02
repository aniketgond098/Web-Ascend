import React from 'react';

interface HudCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'crimson' | 'blue' | 'stealth' | 'active';
  interactive?: boolean;
  glow?: boolean;
  webAccent?: boolean;
  onClick?: () => void;
  id?: string;
}

export const HudCard: React.FC<HudCardProps> = ({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  glow = false,
  webAccent = false,
  onClick,
  id,
}) => {
  const variantStyles = {
    default: 'bg-[#0A0E17]/90 border-blue-900/30 hover:border-blue-500/40',
    active: 'bg-[#0F141F] border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.12)]',
    crimson: 'bg-gradient-to-br from-red-950/30 via-[#0A0E17] to-[#0A0E17] border-red-900/40 hover:border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
    blue: 'bg-gradient-to-br from-blue-950/30 via-[#0A0E17] to-[#0A0E17] border-blue-900/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    stealth: 'bg-[#070B12]/95 border-slate-800/80 hover:border-blue-900/50',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        relative rounded-2xl border backdrop-blur-md transition-all duration-200 overflow-hidden
        ${variantStyles[variant]}
        ${interactive ? 'cursor-pointer active:scale-[0.99] hover:shadow-lg' : ''}
        ${glow ? 'shadow-[0_0_25px_rgba(239,68,68,0.12)]' : ''}
        ${className}
      `}
    >
      {/* Precision corner tech brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/60 pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-400/60 pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-blue-400/60 pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500/60 pointer-events-none z-10" />

      {/* Optional subtle geometric web watermark */}
      {webAccent && (
        <svg
          className="absolute -right-8 -bottom-8 w-36 h-36 opacity-[0.04] pointer-events-none -z-0"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" stroke="#60A5FA" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="30" stroke="#EF4444" strokeWidth="1" />
          <circle cx="50" cy="50" r="15" stroke="#60A5FA" strokeWidth="1" />
          <line x1="50" y1="5" x2="50" y2="95" stroke="#60A5FA" strokeWidth="0.75" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="#60A5FA" strokeWidth="0.75" />
          <line x1="18" y1="18" x2="82" y2="82" stroke="#EF4444" strokeWidth="0.75" />
          <line x1="82" y1="18" x2="18" y2="82" stroke="#EF4444" strokeWidth="0.75" />
        </svg>
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

