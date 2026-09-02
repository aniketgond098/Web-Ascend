import React from 'react';
import { SpiderIcon } from './SpiderIcon';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const WebAscendLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  glow = true,
}) => {
  const iconBoxSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    hero: 'w-16 h-16',
  };

  const spiderSizes = {
    sm: 20,
    md: 26,
    lg: 32,
    hero: 44,
  };

  const textSizes = {
    sm: 'text-sm tracking-widest',
    md: 'text-base tracking-widest',
    lg: 'text-lg tracking-widest',
    hero: 'text-2xl tracking-[0.25em]',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Original Geometric Spider / Web Emblem */}
      <div
        className={`relative ${iconBoxSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-[#131b2e] via-[#090e1a] to-[#1c0d16] border border-red-500/40 shrink-0 group transition-all duration-300 hover:border-red-400 ${
          glow ? 'shadow-[0_0_15px_rgba(239,68,68,0.25)]' : ''
        }`}
      >
        {/* Subtle corner cyan bracket accents */}
        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-blue-400/70" />
        <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-blue-400/70" />

        <SpiderIcon size={spiderSizes[size]} color="#EF4444" glow={glow} />

        {glow && (
          <div className="absolute inset-0 bg-red-600/10 blur-md rounded-xl -z-10" />
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-bold text-white tracking-widest ${textSizes[size]} font-['Chakra_Petch'] leading-none`}>
            WEB <span className="text-red-500">ASCEND</span>
          </h1>
          <span className="text-[9px] tracking-[0.22em] text-blue-400 font-mono mt-1 uppercase font-semibold">
            ASCEND EVERY DAY.
          </span>
        </div>
      )}
    </div>
  );
};


