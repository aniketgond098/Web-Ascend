export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Mission {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  xpReward: number;
  essenceReward: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  date?: string; // YYYY-MM-DD target calendar day (missions are one-day tasks)
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  xpReward: number;
  essenceReward: number;
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  createdAt: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  completedMissionIds: string[];
  completedHabitIds: string[];
  isSuccessfulDay: boolean; // True ONLY when all active required missions + all active habits are completed
  isPerfectDay: boolean; // Alias / synonym for backwards compatibility
  xpEarned: number;
  essenceEarned: number;
  totalRequiredMissions: number;
  totalActiveHabits: number;
  status: 'PERFECT' | 'PARTIAL' | 'MISSED' | 'IN_PROGRESS';
}

export interface XPTransaction {
  id: string;
  amount: number;
  source: 'MISSION' | 'HABIT' | 'PERFECT_DAY' | 'BONUS' | 'INITIAL' | 'LEVEL_BONUS';
  sourceId?: string;
  description: string;
  timestamp: number;
  date: string;
}

export interface EssenceTransaction {
  id: string;
  amount: number; // positive = earned, negative = spent
  source: 'MISSION' | 'HABIT' | 'PERFECT_DAY' | 'LEVEL_UP' | 'RANK_UP' | 'PURCHASE' | 'INITIAL' | 'BONUS';
  sourceId?: string;
  description: string;
  timestamp: number;
  date: string;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  essenceCost: number;
  icon: string;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: number;
}

export interface RewardPurchase {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  timestamp: number;
  date: string;
}

export interface UserProfile {
  username: string;
  level: number;
  rank: RankTier;
  successfulDaysForCurrentRank: number;
  requiredSuccessfulDaysForCurrentRank: number;
  totalSuccessfulDays: number;
  consistencyDaysCompleted: number; // Synchronized alias of totalSuccessfulDays
  totalXP: number;
  currentEssence: number;
  totalEssenceEarned: number;
  currentStreak: number;
  longestStreak: number;
  soundEnabled: boolean;
  initialized: boolean;
  joinedDate: string;
  lastActiveDate: string;
  createdAt?: string | number;
  avatarIcon?: string;
  rpgStats: {
    discipline: number;
    focus: number;
    strength: number;
    intelligence: number;
    consistency: number;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'LEVEL_UP' | 'PERFECT_DAY' | 'STREAK' | 'RANK_PROGRESS' | 'REWARD_UNLOCKED' | 'SYSTEM';
  timestamp: number;
  read: boolean;
}

export type ActiveTab = 'TODAY' | 'MISSIONS' | 'HABITS' | 'TRACKING' | 'REWARDS' | 'ASCEND' | 'PROFILE';
