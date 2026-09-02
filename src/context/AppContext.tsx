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
  RANK_CONFIG,
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
  triggerAscendSimulation: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayDate = getTodayDateString();

  // 1. Initial State Loaders
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    // Default initial profile before onboarding
    return {
      username: 'Operative',
      level: 24,
      rank: 'B',
      totalXP: 2430,
      currentEssence: 2450,
      totalEssenceEarned: 3200,
      consistencyDaysCompleted: 124,
      currentStreak: 27,
      longestStreak: 84,
      soundEnabled: true,
      initialized: true,
      joinedDate: '2026-05-01',
      lastActiveDate: todayDate,
      rpgStats: {
        discipline: 82,
        focus: 76,
        strength: 84,
        intelligence: 90,
        consistency: 88,
      },
    };
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
      currentStreak: 12 + idx * 3,
      longestStreak: 25 + idx * 5,
      createdAt: Date.now() - (idx + 1) * 86400000 * 10,
    }));
  });

  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    
    // Seed initial historical 30 days so calendar and tracking look rich and functional
    const records: Record<string, DailyRecord> = {};
    const now = new Date();
    for (let i = 28; i >= 1; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = formatDateString(d);
      const isPerfect = i % 4 !== 0;
      records[dStr] = {
        date: dStr,
        completedMissionIds: isPerfect ? ['m_1', 'm_2', 'm_3', 'm_4'] : ['m_1', 'm_2'],
        completedHabitIds: isPerfect ? ['h_1', 'h_2', 'h_3', 'h_4', 'h_5'] : ['h_1', 'h_2'],
        isPerfectDay: isPerfect,
        xpEarned: isPerfect ? 210 : 80,
        essenceEarned: isPerfect ? 190 : 70,
        totalRequiredMissions: 3,
        totalActiveHabits: 5,
        status: isPerfect ? 'PERFECT' : 'PARTIAL',
      };
    }

    // Seed Today with partial completion
    records[todayDate] = {
      date: todayDate,
      completedMissionIds: ['m_1', 'm_2'],
      completedHabitIds: ['h_1', 'h_2'],
      isPerfectDay: false,
      xpEarned: 45,
      essenceEarned: 35,
      totalRequiredMissions: 3,
      totalActiveHabits: 5,
      status: 'IN_PROGRESS',
    };

    return records;
  });

  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'xp_1', amount: 25, source: 'MISSION', description: 'Complete Mathematics', timestamp: Date.now() - 3600000 * 4, date: todayDate },
      { id: 'xp_2', amount: 20, source: 'MISSION', description: 'Workout Session', timestamp: Date.now() - 3600000 * 3, date: todayDate },
      { id: 'xp_3', amount: 15, source: 'HABIT', description: 'Wake Up Early', timestamp: Date.now() - 3600000 * 5, date: todayDate },
      { id: 'xp_4', amount: 15, source: 'HABIT', description: 'Daily Hydration', timestamp: Date.now() - 3600000 * 2, date: todayDate },
      { id: 'xp_5', amount: 100, source: 'PERFECT_DAY', description: 'Yesterday Perfect Day', timestamp: Date.now() - 86400000, date: todayDate },
    ];
  });

  const [essenceTransactions, setEssenceTransactions] = useState<EssenceTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'ess_1', amount: 20, source: 'MISSION', description: 'Complete Mathematics', timestamp: Date.now() - 3600000 * 4, date: todayDate },
      { id: 'ess_2', amount: 15, source: 'MISSION', description: 'Workout Session', timestamp: Date.now() - 3600000 * 3, date: todayDate },
      { id: 'ess_3', amount: 15, source: 'HABIT', description: 'Wake Up Early', timestamp: Date.now() - 3600000 * 5, date: todayDate },
      { id: 'ess_4', amount: 10, source: 'HABIT', description: 'Daily Hydration', timestamp: Date.now() - 3600000 * 2, date: todayDate },
      { id: 'ess_5', amount: 100, source: 'PERFECT_DAY', description: 'Yesterday Perfect Day', timestamp: Date.now() - 86400000, date: todayDate },
      { id: 'ess_6', amount: 50, source: 'LEVEL_UP', description: 'Level 24 Milestone', timestamp: Date.now() - 86400000 * 3, date: todayDate },
      { id: 'ess_7', amount: -250, source: 'PURCHASE', description: 'Movie Night Unlocked', timestamp: Date.now() - 86400000 * 2, date: todayDate },
    ];
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
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'pur_1',
        rewardId: 'rew_3',
        rewardName: 'MOVIE NIGHT',
        cost: 250,
        timestamp: Date.now() - 86400000 * 2,
        date: todayDate,
      },
    ];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'notif_1',
        title: 'SYSTEM ONLINE',
        message: 'Welcome back. Neural link active. 4 objectives remaining today.',
        type: 'SYSTEM',
        timestamp: Date.now() - 3600000 * 2,
        read: false,
      },
      {
        id: 'notif_2',
        title: 'STREAK EXTENDED',
        message: '27-day streak maintained. Momentum verified.',
        type: 'STREAK',
        timestamp: Date.now() - 86400000,
        read: true,
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

  // Check Perfect Day Condition
  const evaluateDayCompletion = useCallback((
    completedMissionIds: string[],
    completedHabitIds: string[]
  ) => {
    const requiredActiveMissions = missions.filter((m) => m.isActive && m.isRequired);
    const activeHabits = habits.filter((h) => h.isActive);

    const allRequiredMissionsDone = requiredActiveMissions.every((m) =>
      completedMissionIds.includes(m.id)
    );
    const allHabitsDone = activeHabits.every((h) =>
      completedHabitIds.includes(h.id)
    );

    const isPerfect = allRequiredMissionsDone && allHabitsDone && (requiredActiveMissions.length > 0 || activeHabits.length > 0);

    setDailyRecords((prev) => {
      const currentToday = prev[todayDate] || {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
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
        isPerfectDay: isPerfect,
        totalRequiredMissions: requiredActiveMissions.length,
        totalActiveHabits: activeHabits.length,
        status: isPerfect ? 'PERFECT' : (completedMissionIds.length > 0 || completedHabitIds.length > 0 ? 'PARTIAL' : 'IN_PROGRESS'),
      };

      return {
        ...prev,
        [todayDate]: updatedRecord,
      };
    });

    // Check if Perfect Day reward should be granted (Anti-Farm: once per day)
    if (isPerfect && !hasRewardIssuedToday('PERFECT_DAY')) {
      soundFX.playPerfectDay();
      handleXPAndEssenceGain(
        BASE_REWARDS.perfectDayXP,
        BASE_REWARDS.perfectDayEssence,
        'PERFECT_DAY',
        'Perfect Day: All Objectives Complete'
      );

      // Increment consistency days
      setProfile((prev) => {
        const updatedConsistency = prev.consistencyDaysCompleted + 1;
        const oldRankProg = getRankProgress(prev.consistencyDaysCompleted);
        const newRankProg = getRankProgress(updatedConsistency);

        // Check if rank tier elevated
        if (newRankProg.currentRank !== oldRankProg.currentRank) {
          soundFX.playRankUp();
          const rankBonusEssence = BASE_REWARDS.rankUpEssence;
          const rankTx: EssenceTransaction = {
            id: `ess_rank_${Date.now()}`,
            amount: rankBonusEssence,
            source: 'RANK_UP',
            description: `Ascension to ${newRankProg.currentRank} Achieved`,
            timestamp: Date.now() + 20,
            date: todayDate,
          };
          setEssenceTransactions((txs) => [rankTx, ...txs]);

          addNotification(
            'ASCENSION COMPLETE',
            `Rank upgraded from ${oldRankProg.currentRank} to ${newRankProg.currentRank}! +${rankBonusEssence} Essence awarded.`,
            'RANK_PROGRESS'
          );

          setCelebration({
            type: 'RANK_UP',
            data: {
              oldRank: oldRankProg.currentRank,
              newRank: newRankProg.currentRank,
              bonusEssence: rankBonusEssence,
            },
          });

          return {
            ...prev,
            consistencyDaysCompleted: updatedConsistency,
            rank: newRankProg.currentRank,
            currentEssence: prev.currentEssence + rankBonusEssence,
            totalEssenceEarned: prev.totalEssenceEarned + rankBonusEssence,
          };
        }

        return {
          ...prev,
          consistencyDaysCompleted: updatedConsistency,
        };
      });

      addNotification(
        'PERFECT DAY ACHIEVED',
        `All daily objectives completed. +${BASE_REWARDS.perfectDayXP} XP & +${BASE_REWARDS.perfectDayEssence} Essence awarded.`,
        'PERFECT_DAY'
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
  const initializeProfile = useCallback((username: string, startPreset = true) => {
    const freshProfile: UserProfile = {
      username: username.trim() || 'Operative',
      level: 1,
      rank: 'E',
      totalXP: 0,
      currentEssence: 0,
      totalEssenceEarned: 0,
      consistencyDaysCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      soundEnabled: true,
      initialized: true,
      joinedDate: todayDate,
      lastActiveDate: todayDate,
      rpgStats: {
        discipline: 20,
        focus: 20,
        strength: 20,
        intelligence: 20,
        consistency: 20,
      },
    };

    setProfile(freshProfile);
    if (!startPreset) {
      setDailyRecords({
        [todayDate]: {
          date: todayDate,
          completedMissionIds: [],
          completedHabitIds: [],
          isPerfectDay: false,
          xpEarned: 0,
          essenceEarned: 0,
          totalRequiredMissions: 3,
          totalActiveHabits: 5,
          status: 'IN_PROGRESS',
        },
      });
      setXpTransactions([]);
      setEssenceTransactions([]);
      setPurchases([]);
    }

    addNotification('SYSTEM ONLINE', `Welcome, ${freshProfile.username}. Systems fully online.`, 'SYSTEM');
  }, [todayDate, addNotification]);

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

  // Demo Ascension Trigger for testing/simulation
  const triggerAscendSimulation = useCallback(() => {
    soundFX.playRankUp();
    const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;
    const currentIdx = rankOrder.indexOf(profile.rank as typeof rankOrder[number]);
    const nextIdx = Math.min(rankOrder.length - 1, currentIdx + 1);
    const nextRank = rankOrder[nextIdx];

    setCelebration({
      type: 'RANK_UP',
      data: {
        oldRank: profile.rank,
        newRank: nextRank,
        bonusEssence: BASE_REWARDS.rankUpEssence,
      },
    });

    handleXPAndEssenceGain(
      50,
      BASE_REWARDS.rankUpEssence,
      'RANK_UP',
      `Ascension Simulation: Promoted to ${nextRank}`
    );

    setProfile((prev) => ({
      ...prev,
      rank: nextRank,
      consistencyDaysCompleted: prev.consistencyDaysCompleted + 180,
    }));
  }, [profile.rank, handleXPAndEssenceGain]);

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
