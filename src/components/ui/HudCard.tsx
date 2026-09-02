import React from 'react';

interface HudCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'crimson' | 'blue' | 'stealth' | 'active';
  interactive?: boolean;
  glow?: boolean;
  onClick?: () => void;
  id?: string;
}

export const HudCard: React.FC<HudCardProps> = ({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  glow = false,
  onClick,
  id,
}) => {
  const variantStyles = {
    default: 'bg-slate-900/40 border-blue-900/20 hover:border-blue-500/40',
    active: 'bg-[#0F141F] border-blue-600/40 shadow-[0_0_15px_rgba(37,99,235,0.1)]',
    crimson: 'bg-gradient-to-br from-red-950/20 to-slate-900/40 border-red-900/30 hover:border-red-600/50 shadow-[0_0_15px_rgba(239,68,68,0.08)]',
    blue: 'bg-gradient-to-br from-blue-900/20 to-transparent border-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.08)]',
    stealth: 'bg-[#0A0E17]/90 border-blue-900/20 hover:border-blue-900/40',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        relative rounded-xl border backdrop-blur-md transition-all duration-200
        ${variantStyles[variant]}
        ${interactive ? 'cursor-pointer active:scale-[0.99] hover:shadow-lg' : ''}
        ${glow ? 'shadow-[0_0_20px_rgba(56,189,248,0.15)]' : ''}
        ${className}
      `}
    >
      {/* Precision sleek corner accents */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-blue-400/40 rounded-tl pointer-events-none" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-blue-400/40 rounded-tr pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-blue-400/40 rounded-bl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-blue-400/40 rounded-br pointer-events-none" />

      {children}
    </div>
  );
};

