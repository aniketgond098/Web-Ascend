import React from 'react';

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
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    hero: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-sm tracking-widest',
    md: 'text-base tracking-widest',
    lg: 'text-lg tracking-widest',
    hero: 'text-2xl tracking-[0.25em]',
  };

  return (
    <div className={`inline-flex items-center gap-3 font-bold select-none ${className}`}>
      {/* Sleek Interface Geometric Web Emblem */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
        {/* Outer Red Diamond */}
        <div className="absolute inset-0 border-2 border-red-600 rotate-45 transition-transform duration-500" />
        
        {/* Inner Cyan Diamond */}
        <div className="absolute inset-1.5 border border-blue-400 rotate-12 opacity-60" />
        
        {/* Center Glowing Nexus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
        </div>

        {glow && (
          <div className="absolute inset-0 bg-red-600/10 blur-md rounded-full -z-10" />
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-bold text-white tracking-widest ${textSizes[size]} font-['Chakra_Petch']`}>
            WEB <span className="text-red-500">ASCEND</span>
          </h1>
          {size === 'hero' && (
            <span className="text-[10px] tracking-[0.3em] text-blue-400 font-mono -mt-1">
              SYSTEM v2.4 // PROTOCOL ACTIVE
            </span>
          )}
        </div>
      )}
    </div>
  );
};

