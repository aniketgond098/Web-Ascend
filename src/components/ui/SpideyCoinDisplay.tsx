import React from 'react';

interface SpideyCoinIconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const SpideyCoinIcon: React.FC<SpideyCoinIconProps> = ({
  size = 20,
  className = '',
  glow = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none transition-transform duration-300 group-hover:rotate-12 ${
        glow ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : ''
      } ${className}`}
    >
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
        <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>

      {/* Outer Coin Body */}
      <circle cx="16" cy="16" r="14.5" fill="url(#coinGrad)" stroke="url(#rimGrad)" strokeWidth="1.5" />
      {/* Inner Inset Ring */}
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="#78350F" strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.7" />

      {/* Center Geometric Web / Spider Stamped Emblem */}
      {/* Body */}
      <path d="M16 11 L18.5 16 L16 23 L13.5 16 Z" fill="#451A03" />
      <path d="M16 8 L18 11 L16 13 L14 11 Z" fill="#451A03" />
      <circle cx="16" cy="12" r="0.9" fill="#FEF08A" />

      {/* Legs (Micro geometric) */}
      <path d="M14 9 L10 7 L8 10" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11 L9 11 L7 15" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 15 L9 17 L8 21" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 18 L11 21 L10 25" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M18 9 L22 7 L24 10" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 11 L23 11 L25 15" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 15 L23 17 L24 21" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 18 L21 21 L22 25" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Coin Sheen Highlights */}
      <path d="M6 14 A10 10 0 0 1 18 6" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
};

interface SpideyCoinDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const SpideyCoinDisplay: React.FC<SpideyCoinDisplayProps> = ({
  amount,
  size = 'md',
  showLabel = true,
  className = '',
  interactive = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5',
    hero: 'text-lg px-5 py-2.5 gap-3',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    hero: 28,
  };

  const numberSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-bold',
    lg: 'text-lg font-black',
    hero: 'text-2xl font-black',
  };

  return (
    <div
      onClick={onClick}
      className={`
        group inline-flex items-center rounded-xl bg-gradient-to-b from-[#101726]/95 to-[#090D16]/95
        border border-amber-500/30 hover:border-amber-400/60
        shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all select-none
        ${interactive ? 'cursor-pointer active:scale-95 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <SpideyCoinIcon size={iconSizes[size]} glow={true} />
      <div className="flex flex-col font-mono leading-none">
        {showLabel && size !== 'sm' && (
          <span className="text-[9px] uppercase tracking-wider text-amber-300/80 font-semibold mb-0.5">
            SPIDEY COINS
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <span className={`text-white tracking-wide font-['Chakra_Petch'] ${numberSizes[size]}`}>
            {amount.toLocaleString()}
          </span>
          {showLabel && size === 'sm' && (
            <span className="text-[9px] uppercase tracking-wider text-amber-300/70 font-semibold">
              COINS
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
