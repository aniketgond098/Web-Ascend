import React from 'react';

interface SpiderIconProps {
  className?: string;
  size?: number | string;
  color?: string;
  glow?: boolean;
}

/**
 * ORIGINAL GEOMETRIC SPIDER EMBLEM FOR "WEB ASCEND"
 * Symmetrical, futuristic cyber-web slinger geometry.
 * NOT an official Spider-Man or Marvel logo.
 */
export const SpiderIcon: React.FC<SpiderIconProps> = ({
  className = '',
  size = 24,
  color = 'currentColor',
  glow = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${glow ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]' : ''} ${className}`}
    >
      {/* Central Geometric Abdomen (Lower Hexagonal Diamond) */}
      <path
        d="M24 18 L29 27 L24 40 L19 27 Z"
        fill={color}
        fillOpacity="0.95"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Central Cephalothorax (Upper Angular Diamond) */}
      <path
        d="M24 10 L28 16 L24 20 L20 16 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Center Core Node */}
      <circle cx="24" cy="18" r="1.5" fill="#ffffff" />

      {/* Top Left Leg 1 */}
      <path
        d="M21 13 L13 8 L8 12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top Left Leg 2 */}
      <path
        d="M20 16 L10 14 L6 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Left Leg 3 */}
      <path
        d="M20 23 L11 25 L8 34"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Left Leg 4 */}
      <path
        d="M22 28 L14 34 L12 43"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Right Leg 1 */}
      <path
        d="M27 13 L35 8 L40 12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top Right Leg 2 */}
      <path
        d="M28 16 L38 14 L42 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Right Leg 3 */}
      <path
        d="M28 23 L37 25 L40 34"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom Right Leg 4 */}
      <path
        d="M26 28 L34 34 L36 43"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Web Vector Accent Lines */}
      <circle cx="8" cy="12" r="1" fill={color} />
      <circle cx="40" cy="12" r="1" fill={color} />
      <circle cx="12" cy="43" r="1" fill={color} />
      <circle cx="36" cy="43" r="1" fill={color} />
    </svg>
  );
};
