import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  Mission,
  Habit,
  DailyRecord,
  XPTransaction,
  EssenceTransaction,
  Reward,
  RewardPurchase,
  AppNotification,
  ActiveTab,
  Priority,
} from '../types';
import {
  BASE_REWARDS,
  DEFAULT_REWARDS,
  STARTER_MISSIONS,
  STARTER_HABITS,
  getLevelProgress,
  getRankProgress,
  isSuccessfulConsistencyDay,
  RANK_CONFIG,
  RANK_ORDER,
} from '../config/progression';
import {
  getTodayDateString,
  formatDateString,
  calculateStreaks,
} from '../utils/date';
import { soundFX } from '../utils/audio';

const STORAGE_KEYS = {
  PROFILE: 'web_ascend_profile_v2',
  MISSIONS: 'web_ascend_missions_v2',
  HABITS: 'web_ascend_habits_v2',
  DAILY_RECORDS: 'web_ascend_daily_records_v2',
  XP_TRANSACTIONS: 'web_ascend_xp_tx_v2',
  ESSENCE_TRANSACTIONS: 'web_ascend_essence_tx_v2',
  REWARDS: 'web_ascend_rewards_v2',
  PURCHASES: 'web_ascend_purchases_v2',
  NOTIFICATIONS: 'web_ascend_notifications_v2',
};

interface CelebrationState {
  type: 'LEVEL_UP' | 'RANK_UP' | 'PERFECT_DAY' | 'PURCHASE' | null;
  data?: unknown;
}

interface AppContextType {
  profile: UserProfile;
  missions: Mission[];
  habits: Habit[];
  dailyRecords: Record<string, DailyRecord>;
  xpTransactions: XPTransaction[];
  essenceTransactions: EssenceTransaction[];
  rewards: Reward[];
  purchases: RewardPurchase[];
  notifications: AppNotification[];
  activeTab: ActiveTab;
  todayDate: string;
  celebration: CelebrationState;
  
  // Navigation
  setActiveTab: (tab: ActiveTab) => void;
  setCelebration: (state: CelebrationState) => void;
  closeCelebration: () => void;

  // Mission Actions
  toggleMissionCompletion: (missionId: string) => void;
  createMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;

  // Habit Actions
  toggleHabitCompletion: (habitId: string) => void;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;

  // Reward Actions
  purchaseReward: (rewardId: string) => boolean;
  createReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;

  // Profile & Settings
  initializeProfile: (username: string, startPreset?: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toggleSound: () => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  resetTestProgression: () => void;
  simulateSuccessfulDay: () => void;
  simulateTierAscension: () => void;
  triggerAscendSimulation: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const createDefaultProfile = (today: string): UserProfile => ({
  username: 'Operative',
  level: 1,
  rank: 'E',
  successfulDaysForCurrentRank: 0,
  requiredSuccessfulDaysForCurrentRank: 180,
  totalSuccessfulDays: 0,
  consistencyDaysCompleted: 0,
  totalXP: 0,
  currentEssence: 0,
  totalEssenceEarned: 0,
  currentStreak: 0,
  longestStreak: 0,
  soundEnabled: true,
  initialized: true,
  joinedDate: today,
  lastActiveDate: today,
  rpgStats: {
    discipline: 20,
    focus: 20,
    strength: 20,
    intelligence: 20,
    consistency: 20,
  },
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayDate = getTodayDateString();

  // 1. Initial State Loaders
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Clean legacy demo/fake seeded data (e.g., Rank B, level 24, or 124 days)
        if (
          (parsed.rank === 'B' && parsed.consistencyDaysCompleted === 124) ||
          parsed.totalXP === 2430 ||
          parsed.level === 24
        ) {
          const fresh = createDefaultProfile(todayDate);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(fresh));
          return fresh;
        }

        // Recompute rank and rank progress strictly from totalSuccessfulDays (or consistencyDaysCompleted)
        const totalDays = Math.max(0, parsed.totalSuccessfulDays ?? parsed.consistencyDaysCompleted ?? 0);
        const rankProg = getRankProgress(totalDays);

        return {
          ...createDefaultProfile(todayDate),
          ...parsed,
          rank: rankProg.currentRank,
          successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
          requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
          totalSuccessfulDays: totalDays,
          consistencyDaysCompleted: totalDays,
        };
      } catch {
        // fallback
      }
    }
    // Every newly created user MUST start at Rank E, 0/180, Level 1, 0 XP, 0 Essence
    return createDefaultProfile(todayDate);
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MISSIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return STARTER_MISSIONS.map((m, idx) => ({
      ...m,
      id: `m_${idx + 1}`,
      createdAt: Date.now() - (4 - idx) * 86400000,
      updatedAt: Date.now(),
    }));
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return STARTER_HABITS.map((h, idx) => ({
      ...h,
      id: `h_${idx + 1}`,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: Date.now(),
    }));
  });

  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If legacy seeded records exist (e.g. 210 XP / 190 essence demo patterns), clean them
        const hasLegacySeeded = Object.values(parsed).some(
          (r: any) => r && r.xpEarned === 210 && r.essenceEarned === 190
        );
        if (hasLegacySeeded) {
          return {
            [todayDate]: {
              date: todayDate,
              completedMissionIds: [],
              completedHabitIds: [],
              isSuccessfulDay: false,
              isPerfectDay: false,
              xpEarned: 0,
              essenceEarned: 0,
              totalRequiredMissions: STARTER_MISSIONS.filter((m) => m.isRequired).length,
              totalActiveHabits: STARTER_HABITS.length,
              status: 'IN_PROGRESS',
            },
          };
        }
        return parsed;
      } catch {}
    }

    // New user starts with clean today record
    return {
      [todayDate]: {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: STARTER_MISSIONS.filter((m) => m.isRequired).length,
        totalActiveHabits: STARTER_HABITS.length,
        status: 'IN_PROGRESS',
      },
    };
  });

  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((tx: any) => tx.id === 'xp_5' && tx.description === 'Yesterday Perfect Day')) {
          return [];
        }
        return parsed;
      } catch {}
    }
    return [];
  });

  const [essenceTransactions, setEssenceTransactions] = useState<EssenceTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((tx: any) => tx.id === 'ess_6' && tx.description === 'Level 24 Milestone')) {
          return [];
        }
        return parsed;
      } catch {}
    }
    return [];
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_REWARDS.map((r, idx) => ({
      ...r,
      id: `rew_${idx + 1}`,
      createdAt: Date.now() - idx * 86400000,
    }));
  });

  const [purchases, setPurchases] = useState<RewardPurchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((p: any) => p.id === 'pur_1')) {
          return [];
        }
        return parsed;
      } catch {}
    }
    return [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((n: any) => n.id === 'notif_1' && n.message?.includes('4 objectives remaining'))) {
          return [
            {
              id: `notif_init_${Date.now()}`,
              title: 'SYSTEM ONLINE',
              message: 'Neural link active. Operative initialized at Rank E. Complete all required missions and daily habits to advance.',
              type: 'SYSTEM',
              timestamp: Date.now(),
              read: false,
            },
          ];
        }
        return parsed;
      } catch {}
    }
    return [
      {
        id: `notif_init_${Date.now()}`,
        title: 'SYSTEM ONLINE',
        message: 'Neural link active. Operative initialized at Rank E. Complete all required missions and daily habits to advance.',
        type: 'SYSTEM',
        timestamp: Date.now(),
        read: false,
      },
    ];
  });

  const [activeTab, setActiveTabState] = useState<ActiveTab>('TODAY');
  const [celebration, setCelebration] = useState<CelebrationState>({ type: null });

  const setActiveTab = useCallback((tab: ActiveTab) => {
    soundFX.playBlip();
    setActiveTabState(tab);
  }, []);

  const closeCelebration = useCallback(() => {
    setCelebration({ type: null });
  }, []);

  // Sync sound settings with audio engine
  useEffect(() => {
    soundFX.setEnabled(profile.soundEnabled);
  }, [profile.soundEnabled]);

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(dailyRecords));
  }, [dailyRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.XP_TRANSACTIONS, JSON.stringify(xpTransactions));
  }, [xpTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS, JSON.stringify(essenceTransactions));
  }, [essenceTransactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Helper: check if transaction was already awarded today for source
  const hasRewardIssuedToday = useCallback(
    (source: 'MISSION' | 'HABIT' | 'PERFECT_DAY', sourceId?: string): boolean => {
      return xpTransactions.some(
        (tx) => tx.date === todayDate && tx.source === source && (!sourceId || tx.sourceId === sourceId)
      );
    },
    [xpTransactions, todayDate]
  );

  // Helper: push system notification
  const addNotification = useCallback((title: string, message: string, type: AppNotification['type']) => {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
  }, []);

  // Update streaks whenever daily records change
  useEffect(() => {
    const { currentStreak, longestStreak } = calculateStreaks(dailyRecords, todayDate);
    setProfile((prev) => {
      if (prev.currentStreak === currentStreak && prev.longestStreak === longestStreak) {
        return prev;
      }
      return { ...prev, currentStreak, longestStreak: Math.max(prev.longestStreak, longestStreak) };
    });
  }, [dailyRecords, todayDate]);

  // Check Level Up & Rank Progression after XP change
  const handleXPAndEssenceGain = useCallback((
    xpAmount: number,
    essenceAmount: number,
    source: XPTransaction['source'],
    description: string,
    sourceId?: string
  ) => {
    const now = Date.now();

    // 1. Add Transactions to Ledgers
    const newXpTx: XPTransaction = {
      id: `xp_${now}_${Math.random().toString(36).substring(2, 6)}`,
      amount: xpAmount,
      source,
      sourceId,
      description,
      timestamp: now,
      date: todayDate,
    };

    const newEssenceTx: EssenceTransaction = {
      id: `ess_${now}_${Math.random().toString(36).substring(2, 6)}`,
      amount: essenceAmount,
      source: source as EssenceTransaction['source'],
      sourceId,
      description,
      timestamp: now,
      date: todayDate,
    };

    setXpTransactions((prev) => [newXpTx, ...prev]);
    setEssenceTransactions((prev) => [newEssenceTx, ...prev]);

    // 2. Compute updated profile XP, Level, & Essence
    setProfile((prev) => {
      const updatedTotalXP = prev.totalXP + xpAmount;
      const updatedEssence = prev.currentEssence + essenceAmount;
      const updatedTotalEssenceEarned = prev.totalEssenceEarned + (essenceAmount > 0 ? essenceAmount : 0);

      const oldLevelProg = getLevelProgress(prev.totalXP);
      const newLevelProg = getLevelProgress(updatedTotalXP);

      // Did user level up?
      if (newLevelProg.level > oldLevelProg.level) {
        soundFX.playLevelUp();
        
        // Award level-up bonus essence
        const levelBonusEssence = BASE_REWARDS.levelUpEssence;
        const levelBonusTx: EssenceTransaction = {
          id: `ess_lvl_${now}`,
          amount: levelBonusEssence,
          source: 'LEVEL_UP',
          description: `Level ${newLevelProg.level} Milestone Reward`,
          timestamp: now + 10,
          date: todayDate,
        };
        setEssenceTransactions((txs) => [levelBonusTx, ...txs]);

        addNotification(
          'LEVEL UP',
          `System rank elevated to Level ${newLevelProg.level}. +${levelBonusEssence} Essence awarded.`,
          'LEVEL_UP'
        );

        setCelebration({
          type: 'LEVEL_UP',
          data: {
            oldLevel: oldLevelProg.level,
            newLevel: newLevelProg.level,
            bonusEssence: levelBonusEssence,
          },
        });

        return {
          ...prev,
          totalXP: updatedTotalXP,
          level: newLevelProg.level,
          currentEssence: updatedEssence + levelBonusEssence,
          totalEssenceEarned: updatedTotalEssenceEarned + levelBonusEssence,
        };
      }

      return {
        ...prev,
        totalXP: updatedTotalXP,
        currentEssence: updatedEssence,
        totalEssenceEarned: updatedTotalEssenceEarned,
      };
    });
  }, [todayDate, addNotification]);

  // Check Successful Day Condition and Update Rank Progression
  const evaluateDayCompletion = useCallback((
    completedMissionIds: string[],
    completedHabitIds: string[]
  ) => {
    const requiredActiveMissions = missions.filter((m) => m.isActive && m.isRequired);
    const activeHabits = habits.filter((h) => h.isActive);

    const isSuccessful = isSuccessfulConsistencyDay(
      completedMissionIds,
      completedHabitIds,
      missions,
      habits
    );

    setDailyRecords((prev) => {
      const currentToday = prev[todayDate] || {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: requiredActiveMissions.length,
        totalActiveHabits: activeHabits.length,
        status: 'IN_PROGRESS',
      };

      const updatedRecord: DailyRecord = {
        ...currentToday,
        completedMissionIds,
        completedHabitIds,
        isSuccessfulDay: isSuccessful,
        isPerfectDay: isSuccessful,
        totalRequiredMissions: requiredActiveMissions.length,
        totalActiveHabits: activeHabits.length,
        status: isSuccessful ? 'PERFECT' : (completedMissionIds.length > 0 || completedHabitIds.length > 0 ? 'PARTIAL' : 'IN_PROGRESS'),
      };

      const nextRecords = {
        ...prev,
        [todayDate]: updatedRecord,
      };

      // Calculate total successful days strictly from daily completion records (1 per calendar day max)
      const totalSuccessfulDays = (Object.values(nextRecords) as DailyRecord[]).filter((r) => r.isSuccessfulDay).length;
      const rankProg = getRankProgress(totalSuccessfulDays);

      // Update streaks from daily completion history
      const { currentStreak, longestStreak } = calculateStreaks(nextRecords, todayDate);

      // Update Profile Rank & Consistency
      setProfile((prevProfile) => {
        const prevTierIndex = RANK_ORDER.indexOf(prevProfile.rank);
        const newTierIndex = RANK_ORDER.indexOf(rankProg.currentRank);

        // Check if rank tier elevated (advancement only)
        if (newTierIndex > prevTierIndex) {
          soundFX.playRankUp();
          const rankBonusEssence = BASE_REWARDS.rankUpEssence;
          const rankTx: EssenceTransaction = {
            id: `ess_rank_${Date.now()}`,
            amount: rankBonusEssence,
            source: 'RANK_UP',
            description: `Ascension to Rank ${rankProg.currentRank} Achieved!`,
            timestamp: Date.now() + 20,
            date: todayDate,
          };
          setEssenceTransactions((txs) => [rankTx, ...txs]);

          addNotification(
            'ASCENSION COMPLETED',
            `Operative ascended from Rank ${prevProfile.rank} to Rank ${rankProg.currentRank}! +${rankBonusEssence} Essence awarded.`,
            'RANK_PROGRESS'
          );

          setCelebration({
            type: 'RANK_UP',
            data: {
              oldRank: prevProfile.rank,
              newRank: rankProg.currentRank,
              bonusEssence: rankBonusEssence,
            },
          });

          return {
            ...prevProfile,
            rank: rankProg.currentRank,
            successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
            requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
            totalSuccessfulDays,
            consistencyDaysCompleted: totalSuccessfulDays,
            currentStreak,
            longestStreak: Math.max(prevProfile.longestStreak, longestStreak),
            currentEssence: prevProfile.currentEssence + rankBonusEssence,
            totalEssenceEarned: prevProfile.totalEssenceEarned + rankBonusEssence,
          };
        }

        return {
          ...prevProfile,
          rank: rankProg.currentRank,
          successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
          requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
          totalSuccessfulDays,
          consistencyDaysCompleted: totalSuccessfulDays,
          currentStreak,
          longestStreak: Math.max(prevProfile.longestStreak, longestStreak),
        };
      });

      return nextRecords;
    });

    // Check if Perfect Day reward should be granted (Anti-Farm: once per day)
    if (isSuccessful && !hasRewardIssuedToday('PERFECT_DAY')) {
      soundFX.playPerfectDay();
      handleXPAndEssenceGain(
        BASE_REWARDS.perfectDayXP,
        BASE_REWARDS.perfectDayEssence,
        'PERFECT_DAY',
        'Successful Day: All Required Directives & Habits Complete'
      );

      addNotification(
        'SUCCESSFUL DAY SECURED',
        `All required missions and daily habits completed. +1 Day added to Rank Progress!`,
        'RANK_PROGRESS'
      );

      setCelebration({
        type: 'PERFECT_DAY',
        data: {
          xp: BASE_REWARDS.perfectDayXP,
          essence: BASE_REWARDS.perfectDayEssence,
        },
      });
    }
  }, [missions, habits, todayDate, hasRewardIssuedToday, handleXPAndEssenceGain, addNotification]);

  // Mission Complete/Uncomplete
  const toggleMissionCompletion = useCallback((missionId: string) => {
    const todayRecord = dailyRecords[todayDate] || {
      date: todayDate,
      completedMissionIds: [],
      completedHabitIds: [],
      isPerfectDay: false,
      xpEarned: 0,
      essenceEarned: 0,
      totalRequiredMissions: missions.filter((m) => m.isActive && m.isRequired).length,
      totalActiveHabits: habits.filter((h) => h.isActive).length,
      status: 'IN_PROGRESS',
    };

    const isCurrentlyDone = todayRecord.completedMissionIds.includes(missionId);
    let nextMissionIds: string[];

    if (isCurrentlyDone) {
      // Uncompleting mission: do not refund or deduct (Anti-Farm rule), only toggle visual state
      soundFX.playBlip();
      nextMissionIds = todayRecord.completedMissionIds.filter((id) => id !== missionId);
    } else {
      // Completing mission
      soundFX.playComplete();
      nextMissionIds = [...todayRecord.completedMissionIds, missionId];

      const mission = missions.find((m) => m.id === missionId);
      if (mission) {
        // Anti-Farm Check: Award only if not awarded today yet
        if (!hasRewardIssuedToday('MISSION', missionId)) {
          handleXPAndEssenceGain(
            mission.xpReward || BASE_REWARDS.missionXP,
            mission.essenceReward || BASE_REWARDS.missionEssence,
            'MISSION',
            `Completed: ${mission.title}`,
            missionId
          );
        }
      }
    }

    evaluateDayCompletion(nextMissionIds, todayRecord.completedHabitIds);
  }, [dailyRecords, todayDate, missions, habits, hasRewardIssuedToday, handleXPAndEssenceGain, evaluateDayCompletion]);

  // Habit Complete/Uncomplete
  const toggleHabitCompletion = useCallback((habitId: string) => {
    const todayRecord = dailyRecords[todayDate] || {
      date: todayDate,
      completedMissionIds: [],
      completedHabitIds: [],
      isPerfectDay: false,
      xpEarned: 0,
      essenceEarned: 0,
      totalRequiredMissions: missions.filter((m) => m.isActive && m.isRequired).length,
      totalActiveHabits: habits.filter((h) => h.isActive).length,
      status: 'IN_PROGRESS',
    };

    const isCurrentlyDone = todayRecord.completedHabitIds.includes(habitId);
    let nextHabitIds: string[];

    if (isCurrentlyDone) {
      soundFX.playBlip();
      nextHabitIds = todayRecord.completedHabitIds.filter((id) => id !== habitId);
    } else {
      soundFX.playComplete();
      nextHabitIds = [...todayRecord.completedHabitIds, habitId];

      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        // Anti-Farm Check
        if (!hasRewardIssuedToday('HABIT', habitId)) {
          handleXPAndEssenceGain(
            habit.xpReward || BASE_REWARDS.habitXP,
            habit.essenceReward || BASE_REWARDS.habitEssence,
            'HABIT',
            `Habit: ${habit.name}`,
            habitId
          );
        }
      }
    }

    evaluateDayCompletion(todayRecord.completedMissionIds, nextHabitIds);
  }, [dailyRecords, todayDate, missions, habits, hasRewardIssuedToday, handleXPAndEssenceGain, evaluateDayCompletion]);

  // Mission CRUD
  const createMission = useCallback((data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => {
    soundFX.playBlip();
    const newMission: Mission = {
      ...data,
      id: `m_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setMissions((prev) => [newMission, ...prev]);
    addNotification('MISSION INITIALIZED', `"${newMission.title}" registered in system.`, 'SYSTEM');
  }, [addNotification]);

  const updateMission = useCallback((id: string, updates: Partial<Mission>) => {
    soundFX.playBlip();
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m))
    );
  }, []);

  const deleteMission = useCallback((id: string) => {
    soundFX.playBlip();
    setMissions((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Habit CRUD
  const createHabit = useCallback((data: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => {
    soundFX.playBlip();
    const newHabit: Habit = {
      ...data,
      id: `h_${Date.now()}`,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: Date.now(),
    };
    setHabits((prev) => [...prev, newHabit]);
    addNotification('HABIT INITIALIZED', `"${newHabit.name}" anchor added to protocol.`, 'SYSTEM');
  }, [addNotification]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    soundFX.playBlip();
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    soundFX.playBlip();
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // Reward Purchase & CRUD
  const purchaseReward = useCallback((rewardId: string): boolean => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return false;

    if (profile.currentEssence < reward.essenceCost) {
      soundFX.playBlip();
      addNotification('INSUFFICIENT ESSENCE', `Requires ◈ ${reward.essenceCost} Essence.`, 'SYSTEM');
      return false;
    }

    const now = Date.now();
    soundFX.playPurchase();

    // 1. Deduct essence and record transaction
    const purchaseTx: EssenceTransaction = {
      id: `ess_pur_${now}`,
      amount: -reward.essenceCost,
      source: 'PURCHASE',
      sourceId: reward.id,
      description: `Unlocked: ${reward.name}`,
      timestamp: now,
      date: todayDate,
    };

    const newPurchase: RewardPurchase = {
      id: `pur_${now}`,
      rewardId: reward.id,
      rewardName: reward.name,
      cost: reward.essenceCost,
      timestamp: now,
      date: todayDate,
    };

    setEssenceTransactions((prev) => [purchaseTx, ...prev]);
    setPurchases((prev) => [newPurchase, ...prev]);

    setProfile((prev) => ({
      ...prev,
      currentEssence: prev.currentEssence - reward.essenceCost,
    }));

    addNotification(
      'REWARD UNLOCKED',
      `"${reward.name}" claimed for ◈ ${reward.essenceCost} Essence. Enjoy!`,
      'REWARD_UNLOCKED'
    );

    setCelebration({
      type: 'PURCHASE',
      data: {
        rewardName: reward.name,
        cost: reward.essenceCost,
        icon: reward.icon,
      },
    });

    return true;
  }, [rewards, profile.currentEssence, todayDate, addNotification]);

  const createReward = useCallback((data: Omit<Reward, 'id' | 'createdAt'>) => {
    soundFX.playBlip();
    const newReward: Reward = {
      ...data,
      id: `rew_${Date.now()}`,
      createdAt: Date.now(),
    };
    setRewards((prev) => [...prev, newReward]);
    addNotification('WEB MARKET EXPANDED', `Custom reward "${newReward.name}" listed.`, 'SYSTEM');
  }, [addNotification]);

  const updateReward = useCallback((id: string, updates: Partial<Reward>) => {
    soundFX.playBlip();
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const deleteReward = useCallback((id: string) => {
    soundFX.playBlip();
    setRewards((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Profile Settings
  const initializeProfile = useCallback((username: string) => {
    const freshProfile: UserProfile = {
      ...createDefaultProfile(todayDate),
      username: username.trim() || 'Operative',
    };

    setProfile(freshProfile);
    setDailyRecords({
      [todayDate]: {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: missions.filter((m) => m.isActive && m.isRequired).length,
        totalActiveHabits: habits.filter((h) => h.isActive).length,
        status: 'IN_PROGRESS',
      },
    });
    setXpTransactions([]);
    setEssenceTransactions([]);
    setPurchases([]);

    addNotification('SYSTEM ONLINE', `Welcome, ${freshProfile.username}. Operative initialized at Rank E.`, 'SYSTEM');
  }, [todayDate, missions, habits, addNotification]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleSound = useCallback(() => {
    setProfile((prev) => {
      const nextSound = !prev.soundEnabled;
      soundFX.setEnabled(nextSound);
      if (nextSound) soundFX.playBlip();
      return { ...prev, soundEnabled: nextSound };
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Diagnostic / Dev Tool: Reset Test Progression
  // Sets: Rank -> E, Rank Progress -> 0 / 180, Level -> 1, XP -> 0, Essence -> 0, Streak -> 0
  const resetTestProgression = useCallback(() => {
    soundFX.playBlip();
    const cleanProfile: UserProfile = {
      ...createDefaultProfile(todayDate),
      username: profile.username || 'Operative',
      soundEnabled: profile.soundEnabled ?? true,
    };

    const cleanRecords: Record<string, DailyRecord> = {
      [todayDate]: {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: missions.filter((m) => m.isActive && m.isRequired).length,
        totalActiveHabits: habits.filter((h) => h.isActive).length,
        status: 'IN_PROGRESS',
      },
    };

    setProfile(cleanProfile);
    setDailyRecords(cleanRecords);
    setXpTransactions([]);
    setEssenceTransactions([]);
    setPurchases([]);
    setNotifications([
      {
        id: `notif_reset_${Date.now()}`,
        title: 'PROGRESSION RESET',
        message: 'System re-initialized to Rank E (0 / 180 days), Level 1, 0 XP, 0 Essence.',
        type: 'SYSTEM',
        timestamp: Date.now(),
        read: false,
      },
    ]);

    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cleanProfile));
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(cleanRecords));
    localStorage.removeItem(STORAGE_KEYS.XP_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASES);
  }, [todayDate, profile.username, profile.soundEnabled, missions, habits]);

  // Diagnostic / Dev Tool: Simulate 1 Successful Consistency Day
  const simulateSuccessfulDay = useCallback(() => {
    soundFX.playComplete();
    setDailyRecords((prev) => {
      const now = new Date();
      let dayOffset = 1;
      let dateKey = '';
      while (dayOffset < 3650) {
        const d = new Date(now);
        d.setDate(d.getDate() - dayOffset);
        const str = formatDateString(d);
        if (!prev[str] || !prev[str].isSuccessfulDay) {
          dateKey = str;
          break;
        }
        dayOffset++;
      }

      if (!dateKey) dateKey = todayDate;

      const nextRecords = {
        ...prev,
        [dateKey]: {
          date: dateKey,
          completedMissionIds: ['m_sim'],
          completedHabitIds: ['h_sim'],
          isSuccessfulDay: true,
          isPerfectDay: true,
          xpEarned: 100,
          essenceEarned: 100,
          totalRequiredMissions: 1,
          totalActiveHabits: 1,
          status: 'PERFECT' as const,
        },
      };

      const totalSuccessfulDays = (Object.values(nextRecords) as DailyRecord[]).filter((r) => r.isSuccessfulDay).length;
      const rankProg = getRankProgress(totalSuccessfulDays);
      const { currentStreak, longestStreak } = calculateStreaks(nextRecords, todayDate);

      setProfile((p) => {
        const prevTierIndex = RANK_ORDER.indexOf(p.rank);
        const newTierIndex = RANK_ORDER.indexOf(rankProg.currentRank);

        if (newTierIndex > prevTierIndex) {
          soundFX.playRankUp();
          const bonusEssence = BASE_REWARDS.rankUpEssence;
          setCelebration({
            type: 'RANK_UP',
            data: {
              oldRank: p.rank,
              newRank: rankProg.currentRank,
              bonusEssence,
            },
          });
          return {
            ...p,
            rank: rankProg.currentRank,
            successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
            requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
            totalSuccessfulDays,
            consistencyDaysCompleted: totalSuccessfulDays,
            currentStreak,
            longestStreak: Math.max(p.longestStreak, longestStreak),
            currentEssence: p.currentEssence + bonusEssence,
            totalEssenceEarned: p.totalEssenceEarned + bonusEssence,
          };
        }

        return {
          ...p,
          rank: rankProg.currentRank,
          successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
          requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
          totalSuccessfulDays,
          consistencyDaysCompleted: totalSuccessfulDays,
          currentStreak,
          longestStreak: Math.max(p.longestStreak, longestStreak),
        };
      });

      return nextRecords;
    });
  }, [todayDate]);

  // Diagnostic / Dev Tool: Simulate 180 Successful Consistency Days (Tier Ascension)
  const simulateTierAscension = useCallback(() => {
    soundFX.playRankUp();
    setDailyRecords((prev) => {
      const nextRecords = { ...prev };
      const currentSuccessCount = (Object.values(prev) as DailyRecord[]).filter((r) => r.isSuccessfulDay).length;
      const daysToNextTier = 180 - (currentSuccessCount % 180);
      const daysToAdd = daysToNextTier === 0 ? 180 : daysToNextTier;

      const now = new Date();
      let added = 0;
      let offset = 1;
      while (added < daysToAdd && offset < 5000) {
        const d = new Date(now);
        d.setDate(d.getDate() - offset);
        const str = formatDateString(d);
        if (!nextRecords[str] || !nextRecords[str].isSuccessfulDay) {
          nextRecords[str] = {
            date: str,
            completedMissionIds: ['m_sim'],
            completedHabitIds: ['h_sim'],
            isSuccessfulDay: true,
            isPerfectDay: true,
            xpEarned: 100,
            essenceEarned: 100,
            totalRequiredMissions: 1,
            totalActiveHabits: 1,
            status: 'PERFECT',
          };
          added++;
        }
        offset++;
      }

      const totalSuccessfulDays = (Object.values(nextRecords) as DailyRecord[]).filter((r) => r.isSuccessfulDay).length;
      const rankProg = getRankProgress(totalSuccessfulDays);
      const { currentStreak, longestStreak } = calculateStreaks(nextRecords, todayDate);

      setProfile((p) => {
        const bonusEssence = BASE_REWARDS.rankUpEssence;
        setCelebration({
          type: 'RANK_UP',
          data: {
            oldRank: p.rank,
            newRank: rankProg.currentRank,
            bonusEssence,
          },
        });
        return {
          ...p,
          rank: rankProg.currentRank,
          successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
          requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
          totalSuccessfulDays,
          consistencyDaysCompleted: totalSuccessfulDays,
          currentStreak,
          longestStreak: Math.max(p.longestStreak, longestStreak),
          currentEssence: p.currentEssence + bonusEssence,
          totalEssenceEarned: p.totalEssenceEarned + bonusEssence,
        };
      });

      return nextRecords;
    });
  }, [todayDate]);

  const triggerAscendSimulation = simulateTierAscension;

  const resetAllData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const contextValue = useMemo(() => ({
    profile,
    missions,
    habits,
    dailyRecords,
    xpTransactions,
    essenceTransactions,
    rewards,
    purchases,
    notifications,
    activeTab,
    todayDate,
    celebration,
    setActiveTab,
    setCelebration,
    closeCelebration,
    toggleMissionCompletion,
    createMission,
    updateMission,
    deleteMission,
    toggleHabitCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    purchaseReward,
    createReward,
    updateReward,
    deleteReward,
    initializeProfile,
    updateProfile,
    toggleSound,
    markNotificationRead,
    clearNotifications,
    resetTestProgression,
    simulateSuccessfulDay,
    simulateTierAscension,
    triggerAscendSimulation,
    resetAllData,
  }), [
    profile,
    missions,
    habits,
    dailyRecords,
    xpTransactions,
    essenceTransactions,
    rewards,
    purchases,
    notifications,
    activeTab,
    todayDate,
    celebration,
    setActiveTab,
    closeCelebration,
    toggleMissionCompletion,
    createMission,
    updateMission,
    deleteMission,
    toggleHabitCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    purchaseReward,
    createReward,
    updateReward,
    deleteReward,
    initializeProfile,
    updateProfile,
    toggleSound,
    markNotificationRead,
    clearNotifications,
    resetTestProgression,
    simulateSuccessfulDay,
    simulateTierAscension,
    triggerAscendSimulation,
    resetAllData,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
