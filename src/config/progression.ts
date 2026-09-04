import { RankTier, Reward, Mission, Habit } from '../types';

export interface BaseRewardConfig {
  missionXP: number;
  missionEssence: number;
  habitXP: number;
  habitEssence: number;
  perfectDayXP: number;
  perfectDayEssence: number;
  levelUpEssence: number;
  rankUpEssence: number;
}

export const BASE_REWARDS: BaseRewardConfig = {
  missionXP: 20,
  missionEssence: 20,
  habitXP: 15,
  habitEssence: 15,
  perfectDayXP: 100,
  perfectDayEssence: 100,
  levelUpEssence: 50,
  rankUpEssence: 500,
};

export interface RankInfo {
  tier: RankTier;
  name: string;
  codename: string;
  order: number;
  requiredDaysPerTier: number;
  color: string;
  accentColor: string;
  glowColor: string;
  description: string;
  lore: string;
}

export const RANK_ORDER: RankTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

export const RANK_CONFIG: Record<RankTier, RankInfo> = {
  E: {
    tier: 'E',
    name: 'Rank E',
    codename: 'Vigilante Initiate',
    order: 0,
    requiredDaysPerTier: 180,
    color: '#94a3b8',
    accentColor: '#64748b',
    glowColor: 'rgba(148, 163, 184, 0.3)',
    description: 'Initial system synchronization. Establishing daily foundational discipline.',
    lore: 'The web begins as a single thread. Every master was once a beginner learning the tension of the lines.',
  },
  D: {
    tier: 'D',
    name: 'Rank D',
    codename: 'Street Guardian',
    order: 1,
    requiredDaysPerTier: 180,
    color: '#38bdf8',
    accentColor: '#0284c7',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    description: 'Habits anchoring into muscle memory. Routine resistance reduced.',
    lore: 'Patterns form. The neural feedback loops align with your physical willpower.',
  },
  C: {
    tier: 'C',
    name: 'Rank C',
    codename: 'City Defender',
    order: 2,
    requiredDaysPerTier: 180,
    color: '#22c55e',
    accentColor: '#16a34a',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    description: 'High day-to-day momentum. Daily missions completed with precision.',
    lore: 'You no longer wait for motivation; momentum carries you through gravity.',
  },
  B: {
    tier: 'B',
    name: 'Rank B',
    codename: 'Web Champion',
    order: 3,
    requiredDaysPerTier: 180,
    color: '#3b82f6',
    accentColor: '#2563eb',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    description: 'Profound discipline verified. Resilient against burnout and distractions.',
    lore: 'Your web covers vast ground. Obstacles become mere anchor points for higher leaps.',
  },
  A: {
    tier: 'A',
    name: 'Rank A',
    codename: 'Apex Hero',
    order: 4,
    requiredDaysPerTier: 180,
    color: '#f59e0b',
    accentColor: '#d97706',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Master of daily execution. Consistency transcends circumstance.',
    lore: 'Few reach this elevation. Your discipline is an active force field in daily life.',
  },
  S: {
    tier: 'S',
    name: 'Rank S',
    codename: 'Transcendent Web-Slinger',
    order: 5,
    requiredDaysPerTier: 180,
    color: '#ef4444',
    accentColor: '#dc2626',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    description: 'Legendary discipline. Elite focus across all life domains.',
    lore: 'The apex of individual fortitude. You dictate your outcomes with absolute certainty.',
  },
  SS: {
    tier: 'SS',
    name: 'Rank SS',
    codename: 'CHRONO ASCENDANT',
    order: 6,
    requiredDaysPerTier: 180,
    color: '#ec4899',
    accentColor: '#db2777',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    description: 'Transcendent mastery. Years of unwavering daily excellence.',
    lore: 'Time itself bends to your routines. Unshakeable flow state in every mission.',
  },
  SSS: {
    tier: 'SSS',
    name: 'Rank SSS',
    codename: 'SUPREME ARCHITECT',
    order: 7,
    requiredDaysPerTier: 180,
    color: '#a855f7',
    accentColor: '#9333ea',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    description: 'God-tier consistency. The ultimate state of personal productivity.',
    lore: 'You are the architect of your universe. The web is fully illuminated.',
  },
};

/**
 * Calculates XP threshold required to complete a given level.
 * Level 1 -> 150 XP
 * Level 2 -> 220 XP
 * Level 5 -> ~450 XP
 * Level 24 -> ~2,800 XP
 */
export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 150;
  return Math.floor(120 * Math.pow(level, 1.15) + 30);
}

/**
 * Calculates current level and progress from total XP.
 */
export function getLevelProgress(totalXP: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  let level = 1;
  let remainingXP = Math.max(0, totalXP);
  
  while (true) {
    const needed = getXPRequiredForLevel(level);
    if (remainingXP < needed) {
      const progressPercent = Math.min(100, Math.round((remainingXP / needed) * 100));
      return {
        level,
        currentLevelXP: remainingXP,
        nextLevelXP: needed,
        progressPercent,
      };
    }
    remainingXP -= needed;
    level++;
  }
}

export const REQUIRED_DAYS_PER_TIER = 180;

/**
 * Calculates rank progression from total consistency days.
 * Rules:
 * - Starting rank is ALWAYS E with 0 / 180 successful days.
 * - E -> D = 180 successful days
 * - D -> C = 180 additional successful days
 * - C -> B = 180 additional successful days
 * - B -> A = 180 additional successful days
 * - A -> S = 180 additional successful days
 * - S -> SS = 180 additional successful days
 * - SS -> SSS = 180 additional successful days
 * - When successfulDays reaches 180, rank elevates to next tier and current-tier counter resets to 0.
 * - Total successful days never decrease when a day is missed.
 */
export function getRankProgress(
  totalSuccessfulDays: number,
  daysPerTier: number = REQUIRED_DAYS_PER_TIER
): {
  currentRank: RankTier;
  nextRank: RankTier | null;
  successfulDaysForCurrentRank: number;
  requiredSuccessfulDaysForCurrentRank: number;
  daysInCurrentRank: number;
  daysNeededForNextRank: number;
  daysRemaining: number;
  progressPercent: number;
  isMaxRank: boolean;
  totalSuccessfulDays: number;
} {
  const safeDays = Math.max(0, Math.floor(totalSuccessfulDays || 0));
  const currentTierIndex = Math.min(
    RANK_ORDER.length - 1,
    Math.floor(safeDays / daysPerTier)
  );
  
  const currentRank = RANK_ORDER[currentTierIndex];
  const isMaxRank = currentTierIndex >= RANK_ORDER.length - 1;
  const nextRank = isMaxRank ? null : RANK_ORDER[currentTierIndex + 1];
  
  const successfulDaysForCurrentRank = isMaxRank 
    ? daysPerTier 
    : safeDays % daysPerTier;
    
  const requiredSuccessfulDaysForCurrentRank = daysPerTier;
  const daysRemaining = isMaxRank ? 0 : requiredSuccessfulDaysForCurrentRank - successfulDaysForCurrentRank;
  const progressPercent = isMaxRank 
    ? 100 
    : Math.min(100, Math.round((successfulDaysForCurrentRank / requiredSuccessfulDaysForCurrentRank) * 100));

  return {
    currentRank,
    nextRank,
    successfulDaysForCurrentRank,
    requiredSuccessfulDaysForCurrentRank,
    daysInCurrentRank: successfulDaysForCurrentRank,
    daysNeededForNextRank: requiredSuccessfulDaysForCurrentRank,
    daysRemaining,
    progressPercent,
    isMaxRank,
    totalSuccessfulDays: safeDays,
  };
}

/**
 * Evaluates whether a calendar day is a SUCCESSFUL CONSISTENCY DAY.
 * A day is ONLY counted as successful when:
 * 1. ALL active required missions are completed (m.isActive && m.isRequired)
 * 2. ALL active daily habits are completed (h.isActive)
 * 
 * Optional missions (m.isRequired === false) MUST NOT be required for a successful day.
 */
export function isSuccessfulConsistencyDay(
  completedMissionIds: string[],
  completedHabitIds: string[],
  activeMissions: Mission[],
  activeHabits: Habit[]
): boolean {
  const requiredMissions = activeMissions.filter((m) => m.isActive && m.isRequired);
  const dailyHabits = activeHabits.filter((h) => h.isActive);

  // If there are no required missions and no active habits, day cannot be evaluated as successful
  if (requiredMissions.length === 0 && dailyHabits.length === 0) {
    return false;
  }

  const allRequiredMissionsDone = requiredMissions.every((m) =>
    completedMissionIds.includes(m.id)
  );

  const allHabitsDone = dailyHabits.every((h) =>
    completedHabitIds.includes(h.id)
  );

  return allRequiredMissionsDone && allHabitsDone;
}

export const DEFAULT_REWARDS: Omit<Reward, 'id' | 'createdAt'>[] = [
  {
    name: '30 MIN NEURAL SIM',
    description: 'Immersive gaming session / reflex simulation on PC or console.',
    essenceCost: 100,
    icon: 'NEURAL_SIM',
    isActive: true,
    isDefault: true,
  },
  {
    name: 'BIO-FUEL RATION',
    description: 'High-quality nutritious snack or confectionery recharge.',
    essenceCost: 150,
    icon: 'BIO_RATION',
    isActive: true,
    isDefault: true,
  },
  {
    name: 'STARK VISOR CINEMA',
    description: 'Feature-length film or documentary stream with zero distractions.',
    essenceCost: 250,
    icon: 'HOLO_SCREEN',
    isActive: true,
    isDefault: true,
  },
  {
    name: 'TACTICAL COMBAT SIM',
    description: 'Extended deep gaming session after clearing daily directives.',
    essenceCost: 300,
    icon: 'TACTICAL_ARCADE',
    isActive: true,
    isDefault: true,
  },
  {
    name: 'AVENGERS TOWER DINING',
    description: 'Order in or cook your favorite luxury meal or celebratory feast.',
    essenceCost: 500,
    icon: 'STARK_FEAST',
    isActive: true,
    isDefault: true,
  },
  {
    name: 'CRYO-RECHARGE CYCLE',
    description: 'Zero obligations. Complete freedom to rest and restore neural stamina.',
    essenceCost: 750,
    icon: 'RECHARGE_CYCLE',
    isActive: true,
    isDefault: true,
  },
];

export const STARTER_MISSIONS: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Complete Core Study / Work Block',
    description: 'Focus for 90 minutes with zero distractions or social media.',
    priority: 'HIGH',
    xpReward: 30,
    essenceReward: 25,
    isRequired: true,
    isActive: true,
  },
  {
    title: 'Physical Workout / Movement',
    description: 'Weight lifting, calisthenics, running, or high intensity training.',
    priority: 'HIGH',
    xpReward: 25,
    essenceReward: 20,
    isRequired: true,
    isActive: true,
  },
  {
    title: 'Deep Programming / Skill Session',
    description: 'Build projects or solve challenging engineering problems.',
    priority: 'MEDIUM',
    xpReward: 25,
    essenceReward: 20,
    isRequired: true,
    isActive: true,
  },
  {
    title: 'Organize Workspace & Plan Tomorrow',
    description: 'Clean physical desk and outline next day top 3 objectives.',
    priority: 'LOW',
    xpReward: 15,
    essenceReward: 10,
    isRequired: false,
    isActive: true,
  },
];

export const STARTER_HABITS: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>[] = [
  {
    name: 'Wake Up Early',
    description: 'Rise on first alarm without snoozing.',
    xpReward: 15,
    essenceReward: 15,
    isActive: true,
  },
  {
    name: 'Daily Hydration (2.5L+)',
    description: 'Drink optimal clean water throughout the day.',
    xpReward: 10,
    essenceReward: 10,
    isActive: true,
  },
  {
    name: 'Daily Reading (20 mins)',
    description: 'Read non-fiction, philosophy, or technical documentation.',
    xpReward: 15,
    essenceReward: 15,
    isActive: true,
  },
  {
    name: 'Mindfulness & Meditation',
    description: '10 minutes of quiet breathwork or mental centering.',
    xpReward: 15,
    essenceReward: 10,
    isActive: true,
  },
  {
    name: 'Sleep on Time',
    description: 'Screens off by target hour for 8 hours of restorative rest.',
    xpReward: 20,
    essenceReward: 15,
    isActive: true,
  },
];
