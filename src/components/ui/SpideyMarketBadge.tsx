import React from 'react';
import {
  Gamepad2,
  Film,
  Utensils,
  BatteryCharging,
  Zap,
  Bot,
  Headphones,
  BookOpen,
  Coffee,
  Sparkles,
  Flame,
  Radio,
  Package,
  Eye,
  ShieldCheck,
  Compass,
  Tv,
  Crosshair,
  Wrench,
} from 'lucide-react';
import { SpiderIcon } from './SpiderIcon';

export interface SpideyGearConfig {
  id: string;
  name: string;
  category: 'FOCUS' | 'LEISURE' | 'UPGRADE' | 'GEAR';
  techLabel: string;
  color: string;
  accentColor: string;
  glowColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  description: string;
}

export const SPIDEY_GEAR_REGISTRY: Record<string, SpideyGearConfig> = {
  NEURAL_SIM: {
    id: 'NEURAL_SIM',
    name: 'Neural Holo-Sim',
    category: 'LEISURE',
    techLabel: 'SIM-MOD // MK-I',
    color: '#3B82F6',
    accentColor: '#1D4ED8',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    icon: Gamepad2,
    description: 'Immersive gaming simulation and reflex conditioning.',
  },
  TACTICAL_ARCADE: {
    id: 'TACTICAL_ARCADE',
    name: 'Combat Holo-Deck',
    category: 'LEISURE',
    techLabel: 'SIM-MOD // PRO',
    color: '#8B5CF6',
    accentColor: '#6D28D9',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    icon: Crosshair,
    description: 'Extended gaming & deep simulation environment.',
  },
  HOLO_SCREEN: {
    id: 'HOLO_SCREEN',
    name: 'Stark Visor Cinema',
    category: 'LEISURE',
    techLabel: 'OPTIC-STREAM',
    color: '#EC4899',
    accentColor: '#BE185D',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    icon: Film,
    description: 'Zero-interruption cinematic streaming & narrative immersion.',
  },
  BIO_RATION: {
    id: 'BIO_RATION',
    name: 'Nutritional Ration Bar',
    category: 'FOCUS',
    techLabel: 'BIO-FUEL // CAL',
    color: '#F59E0B',
    accentColor: '#B45309',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    icon: Package,
    description: 'Rapid glycemic replenishment and focus reinforcement.',
  },
  STARK_FEAST: {
    id: 'STARK_FEAST',
    name: 'Avengers Tower Dining',
    category: 'LEISURE',
    techLabel: 'PROTEIN-RESERVE',
    color: '#EF4444',
    accentColor: '#B91C1C',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    icon: Utensils,
    description: 'High-calorie luxury meal or celebrated feast.',
  },
  WEB_FLUID: {
    id: 'WEB_FLUID',
    name: 'Neuro-Fluid Brew',
    category: 'FOCUS',
    techLabel: 'FLUID-PRESS // 100',
    color: '#06B6D4',
    accentColor: '#0E7490',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    icon: Coffee,
    description: 'Specialty roasted espresso or brain-stimulating beverage.',
  },
  RECHARGE_CYCLE: {
    id: 'RECHARGE_CYCLE',
    name: 'Cryo-Sleep Chamber',
    category: 'LEISURE',
    techLabel: 'CRYO-REGEN // STASIS',
    color: '#10B981',
    accentColor: '#047857',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    icon: BatteryCharging,
    description: 'Zero obligations. Deep neural restoration and rest.',
  },
  SPIDER_BOT: {
    id: 'SPIDER_BOT',
    name: 'Spider-Bot Recon Unit',
    category: 'GEAR',
    techLabel: 'DRONE // AUTONOMOUS',
    color: '#EF4444',
    accentColor: '#991B1B',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    icon: Bot,
    description: 'Automated field gadget or personal workspace upgrade.',
  },
  ACOUSTIC_AMP: {
    id: 'ACOUSTIC_AMP',
    name: 'Sonic Web Resonator',
    category: 'LEISURE',
    techLabel: 'AUDIO-CORE // HIFI',
    color: '#A855F7',
    accentColor: '#7E22CE',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    icon: Headphones,
    description: 'Deep audio immersion, albums, or dedicated listening.',
  },
  INTEL_ARCHIVE: {
    id: 'INTEL_ARCHIVE',
    name: 'Daily Bugle Intel Feed',
    category: 'UPGRADE',
    techLabel: 'INTEL-MEM // ENCRYPT',
    color: '#3B82F6',
    accentColor: '#1E40AF',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    icon: BookOpen,
    description: 'High-value literature, comic archives, or investigative study.',
  },
  KINETIC_BOOST: {
    id: 'KINETIC_BOOST',
    name: 'Web-Shooter Overhaul',
    category: 'UPGRADE',
    techLabel: 'KINETIC // ACCEL',
    color: '#F97316',
    accentColor: '#C2410C',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    icon: Flame,
    description: 'Physical equipment, apparel, or athletic gear addition.',
  },
  STEALTH_WEAVE: {
    id: 'STEALTH_WEAVE',
    name: 'Chameleon Stealth Cloak',
    category: 'LEISURE',
    techLabel: 'OPTIC-CAMO // MK-II',
    color: '#64748B',
    accentColor: '#334155',
    glowColor: 'rgba(100, 116, 139, 0.4)',
    icon: ShieldCheck,
    description: 'Undisturbed outdoor solitude or private retreat time.',
  },
  TECH_FABRICATOR: {
    id: 'TECH_FABRICATOR',
    name: 'Stark Lab Nano-Forge',
    category: 'GEAR',
    techLabel: 'FABRICATOR // NANO',
    color: '#EAB308',
    accentColor: '#A16207',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    icon: Wrench,
    description: 'Physical maker tools, hardware gadgets, or accessories.',
  },
  CHRONO_PORTAL: {
    id: 'CHRONO_PORTAL',
    name: 'Multiverse Web Anchor',
    category: 'UPGRADE',
    techLabel: 'DIMENSION // TRANSCEND',
    color: '#D946EF',
    accentColor: '#A21CAF',
    glowColor: 'rgba(217, 70, 239, 0.4)',
    icon: Sparkles,
    description: 'Significant milestone reward or high-value celebration.',
  },
};

// Map legacy emoji strings or nicknames to the Spider-Man gear system
const EMOJI_TO_GEAR_MAP: Record<string, string> = {
  '🎮': 'NEURAL_SIM',
  '🕹️': 'TACTICAL_ARCADE',
  '🎬': 'HOLO_SCREEN',
  '🍫': 'BIO_RATION',
  '🍕': 'STARK_FEAST',
  '🍔': 'STARK_FEAST',
  '☕': 'WEB_FLUID',
  '😴': 'RECHARGE_CYCLE',
  '🏖️': 'STEALTH_WEAVE',
  '📚': 'INTEL_ARCHIVE',
  '👟': 'KINETIC_BOOST',
  '🎵': 'ACOUSTIC_AMP',
  '🧁': 'BIO_RATION',
  '🎁': 'SPIDER_BOT',
  '🔧': 'TECH_FABRICATOR',
  '✨': 'CHRONO_PORTAL',
};

export function resolveSpideyGear(iconOrKey: string): SpideyGearConfig {
  // If it directly matches a registry key
  if (SPIDEY_GEAR_REGISTRY[iconOrKey]) {
    return SPIDEY_GEAR_REGISTRY[iconOrKey];
  }

  // If it's a legacy emoji
  const mappedKey = EMOJI_TO_GEAR_MAP[iconOrKey];
  if (mappedKey && SPIDEY_GEAR_REGISTRY[mappedKey]) {
    return SPIDEY_GEAR_REGISTRY[mappedKey];
  }

  // Fallback dynamic gear for unknown icons
  return {
    id: 'CUSTOM_GEAR',
    name: 'Custom Web Asset',
    category: 'GEAR',
    techLabel: 'TECH-ASSET // MK-V',
    color: '#EF4444',
    accentColor: '#991B1B',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    icon: Sparkles,
    description: 'Custom operative reward upgrade.',
  };
}

interface SpideyMarketBadgeProps {
  iconKey: string;
  size?: 'sm' | 'md' | 'lg';
  showTechTag?: boolean;
  className?: string;
}

export const SpideyMarketBadge: React.FC<SpideyMarketBadgeProps> = ({
  iconKey,
  size = 'md',
  showTechTag = false,
  className = '',
}) => {
  const gear = resolveSpideyGear(iconKey);
  const IconComponent = gear.icon;

  const sizeClasses = {
    sm: {
      container: 'w-10 h-10 rounded-xl',
      iconSize: 18,
      spiderSize: 10,
      badgePadding: 'p-2',
    },
    md: {
      container: 'w-14 h-14 rounded-2xl',
      iconSize: 24,
      spiderSize: 14,
      badgePadding: 'p-3',
    },
    lg: {
      container: 'w-18 h-18 rounded-2xl',
      iconSize: 32,
      spiderSize: 18,
      badgePadding: 'p-4',
    },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* High-Tech Spider Emblem Badge Container */}
      <div
        className={`relative ${sizeClasses.container} flex items-center justify-center shrink-0 border overflow-hidden transition-transform duration-300 group-hover:scale-105`}
        style={{
          backgroundColor: '#070B12',
          borderColor: `${gear.color}50`,
          boxShadow: `0 0 16px ${gear.glowColor}, inset 0 0 12px ${gear.glowColor}`,
        }}
      >
        {/* Futuristic Cyber Web Grid Background SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Radial spider web lines */}
          <line x1="30" y1="30" x2="0" y2="0" stroke={gear.color} strokeWidth="1" />
          <line x1="30" y1="30" x2="60" y2="0" stroke={gear.color} strokeWidth="1" />
          <line x1="30" y1="30" x2="60" y2="60" stroke={gear.color} strokeWidth="1" />
          <line x1="30" y1="30" x2="0" y2="60" stroke={gear.color} strokeWidth="1" />
          <line x1="30" y1="0" x2="30" y2="60" stroke={gear.color} strokeWidth="0.75" />
          <line x1="0" y1="30" x2="60" y2="30" stroke={gear.color} strokeWidth="0.75" />
          {/* Concentric diamond webbing */}
          <polygon points="30,12 48,30 30,48 12,30" stroke={gear.color} strokeWidth="0.8" fill="none" />
          <polygon points="30,20 40,30 30,40 20,30" stroke={gear.color} strokeWidth="0.6" fill="none" />
        </svg>

        {/* Ambient Corner Bracket Markers */}
        <div
          className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l pointer-events-none"
          style={{ borderColor: gear.color }}
        />
        <div
          className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r pointer-events-none"
          style={{ borderColor: gear.color }}
        />
        <div
          className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l pointer-events-none"
          style={{ borderColor: gear.color }}
        />
        <div
          className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r pointer-events-none"
          style={{ borderColor: gear.color }}
        />

        {/* Miniature Cyber Spider Watermark */}
        <div className="absolute top-1 right-1 pointer-events-none opacity-40">
          <SpiderIcon size={sizeClasses.spiderSize} color={gear.color} />
        </div>

        {/* Core Tactical Icon */}
        <div className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          <IconComponent
            size={sizeClasses.iconSize}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Diagonal Tech Scanline Accent */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"
        />
      </div>

      {showTechTag && (
        <div className="flex flex-col font-mono text-left">
          <span
            className="text-[9px] font-bold tracking-wider uppercase"
            style={{ color: gear.color }}
          >
            {gear.techLabel}
          </span>
          <span className="text-xs font-bold text-white font-['Chakra_Petch'] uppercase">
            {gear.name}
          </span>
        </div>
      )}
    </div>
  );
};
