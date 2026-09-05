import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserProfile,
  RankTier,
  Mission,
  Habit,
  DailyRecord,
  XPTransaction,
  EssenceTransaction,
  Reward,
  RewardPurchase,
  AppNotification,
  ActiveTab,
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
  calculateStreaks,
  formatDateString,
  parseDateString,
  formatReadableDate,
  getMissionDate,
} from '../utils/date';
import { soundFX } from '../utils/audio';
import { supabase, isSupabaseConfigured, hasSecretKeyConfigured } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

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

export type SyncStatus = 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'LOCAL';

interface AppContextType {
  // Authentication & Source of Truth State
  user: any | null;
  authLoading: boolean;
  dataLoading: boolean;
  syncStatus: SyncStatus;
  isSupabaseReady: boolean;
  hasSecretKeyError: boolean;
  isMissingTablesError: boolean;
  checkMissingTables: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  supabaseConfigModalOpen: boolean;
  setSupabaseConfigModalOpen: (open: boolean) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;
  migrationModalOpen: boolean;
  setMigrationModalOpen: (open: boolean) => void;
  isMigrationAvailable: boolean;
  importLocalDataToCloud: () => Promise<void>;
  dismissMigration: () => void;
  signOut: () => Promise<void>;

  // Core Data
  profile: UserProfile;
  missions: Mission[];
  todayMissions: Mission[];
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
  
  // Navigation & Modals
  setActiveTab: (tab: ActiveTab) => void;
  setCelebration: (state: CelebrationState) => void;
  closeCelebration: () => void;

  // Mission Actions
  toggleMissionCompletion: (missionId: string) => Promise<void>;
  createMission: (mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'> & { date?: string }) => Promise<void>;
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;

  // Habit Actions
  toggleHabitCompletion: (habitId: string) => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  // Reward Actions
  purchaseReward: (rewardId: string) => Promise<boolean>;
  createReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Promise<void>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;

  // Profile & Settings
  initializeProfile: (username: string, startPreset?: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleSound: () => void;
  addNotification: (title: string, message: string, type: AppNotification['type']) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  refreshCloudData: () => Promise<void>;
  reloadAuthAndConfig: () => Promise<void>;
  setUserAndSync: (newUser: any) => Promise<void>;
  setSpideyCoins: (amount?: number) => Promise<void>;

  // Simulation & Testing
  reinitializeOperative: () => Promise<void>;
  resetTestProgression: () => void;
  simulateSuccessfulDay: () => void;
  simulateTierAscension: () => void;
  triggerAscendSimulation: () => void;
  simulateNextDay: () => void;
  jumpToCurrentDate: () => void;
  resetAllData: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const createDefaultProfile = (today: string, username?: string): UserProfile => {
  let initialName = username;
  if (!initialName) {
    try {
      const savedName = localStorage.getItem('web_ascend_custom_username');
      if (savedName && savedName.trim()) initialName = savedName.trim();
    } catch {}
  }
  return {
    username: initialName || 'OPERATIVE',
    level: 1,
    rank: 'E',
    successfulDaysForCurrentRank: 0,
    requiredSuccessfulDaysForCurrentRank: 180,
    totalSuccessfulDays: 0,
    consistencyDaysCompleted: 0,
    totalXP: 0,
    currentEssence: 50,
    totalEssenceEarned: 50,
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
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todayDate, setTodayDate] = useState<string>(getTodayDateString());

  // Check for calendar day change / rollover
  useEffect(() => {
    const checkDay = () => {
      const current = getTodayDateString();
      setTodayDate((prev) => (prev !== current ? current : prev));
    };
    const interval = setInterval(checkDay, 15000);
    window.addEventListener('focus', checkDay);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkDay);
    };
  }, []);

  // 1. Auth & Connectivity State
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('LOCAL');
  const [isMigrationAvailable, setIsMigrationAvailable] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [isMissingTablesError, setIsMissingTablesError] = useState<boolean>(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [supabaseConfigModalOpen, setSupabaseConfigModalOpen] = useState<boolean>(false);
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [migrationModalOpen, setMigrationModalOpen] = useState<boolean>(false);

  // Core Data States
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedCustomUsername = localStorage.getItem('web_ascend_custom_username');
        if (savedCustomUsername && savedCustomUsername.trim() && (!parsed.username || parsed.username === 'OPERATIVE' || parsed.username === 'Operative')) {
          parsed.username = savedCustomUsername.trim();
        }
        // One-time initialization calibration to 50 Spidey Coins
        if (!localStorage.getItem('web_ascend_coins_reset_to_50_v2')) {
          parsed.currentEssence = 50;
          parsed.totalEssenceEarned = Math.max(50, parsed.totalEssenceEarned || 0);
        }
        return parsed;
      }
    } catch {}
    return createDefaultProfile(getTodayDateString());
  });
  const [missions, setMissions] = useState<Mission[]>(() => {
    const today = getTodayDateString();
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MISSIONS);
      if (saved) {
        const parsed: Mission[] = JSON.parse(saved);
        // Calibrate existing missions for current session so today's directives are available
        const CALIBRATED_KEY = 'web_ascend_missions_calibrated_today_v2';
        if (!localStorage.getItem(CALIBRATED_KEY)) {
          localStorage.setItem(CALIBRATED_KEY, 'true');
          return parsed.map((m) => ({
            ...m,
            date: today,
            createdAt: Date.now(),
          }));
        }
        return parsed.map((m) => ({
          ...m,
          date: m.date || (m.createdAt ? formatDateString(new Date(m.createdAt)) : today),
        }));
      }
    } catch {}
    return STARTER_MISSIONS.map((m, idx) => ({
      ...m,
      id: `m_${idx + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      date: today,
    }));
  });
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return STARTER_HABITS.map((h, idx) => ({
      ...h,
      id: `h_${idx + 1}`,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: Date.now(),
    }));
  });
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      [todayDate]: {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: 3,
        totalActiveHabits: 3,
        status: 'IN_PROGRESS',
      },
    };
  });
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [essenceTransactions, setEssenceTransactions] = useState<EssenceTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: `cointx_init_${Date.now()}`,
        amount: 50,
        source: 'INITIAL',
        description: 'Starter Operative Allowance',
        timestamp: Date.now(),
        date: todayDate,
      },
    ];
  });
  const [rewards, setRewards] = useState<Reward[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return DEFAULT_REWARDS.map((r, idx) => ({
      ...r,
      id: `r_${idx + 1}`,
      createdAt: Date.now() - idx * 86400000,
    }));
  });
  const [purchases, setPurchases] = useState<RewardPurchase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('TODAY');
  const [celebration, setCelebration] = useState<CelebrationState>({ type: null });

  // Sync state to localStorage (always save local cache so page reloads or tab switches remain in sync)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      if (profile.username && profile.username !== 'OPERATIVE' && profile.username !== 'Operative') {
        localStorage.setItem('web_ascend_custom_username', profile.username);
      }
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
      localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(dailyRecords));
      localStorage.setItem(STORAGE_KEYS.XP_TRANSACTIONS, JSON.stringify(xpTransactions));
      localStorage.setItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS, JSON.stringify(essenceTransactions));
      localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }
  }, [profile, missions, habits, dailyRecords, xpTransactions, essenceTransactions, rewards, purchases, notifications]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      if (user) setSyncStatus('SYNCED');
      else setSyncStatus('LOCAL');
    };
    const handleOffline = () => setSyncStatus('OFFLINE');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Check if Supabase tables are provisioned
  const checkMissingTables = useCallback(async () => {
    if (!isSupabaseConfigured() || hasSecretKeyConfigured()) {
      setIsMissingTablesError(false);
      return;
    }
    try {
      const res = await supabaseService.testConnection();
      if (res.isMissingTables) {
        setIsMissingTablesError(true);
      } else if (res.ok) {
        setIsMissingTablesError(false);
      }
    } catch {
      // ignore
    }
  }, []);

  // Supabase dynamic config version tracker
  const [configVersion, setConfigVersion] = useState(0);

  const reloadAuthAndConfig = useCallback(async () => {
    setConfigVersion((v) => v + 1);
    await checkMissingTables();
  }, [checkMissingTables]);

  // Listen for config update events (e.g. when user saves URL & Key in SupabaseConfigModal)
  useEffect(() => {
    const handleConfigEvent = () => {
      reloadAuthAndConfig();
    };
    window.addEventListener('supabase_config_updated', handleConfigEvent);
    return () => window.removeEventListener('supabase_config_updated', handleConfigEvent);
  }, [reloadAuthAndConfig]);

  const lastSyncTimeRef = useRef<number>(Date.now());

  // Run missing tables check on mount / config change
  useEffect(() => {
    checkMissingTables();
  }, [checkMissingTables, configVersion]);

  // Load data from Supabase for authenticated user
  const loadCloudData = useCallback(async (userId: string, isBackgroundSync: boolean = false) => {
    if (!isBackgroundSync) setDataLoading(true);
    setSyncStatus('SYNCING');
    try {
      const data = await supabaseService.fetchAllUserData(userId, todayDate);
      lastSyncTimeRef.current = Date.now();

      // Preserve custom codename if cloud profile returned generic default 'OPERATIVE'
      let finalUsername = data.profile.username;
      const localCustomName = localStorage.getItem('web_ascend_custom_username');
      if (
        (!finalUsername || finalUsername === 'OPERATIVE' || finalUsername === 'Operative') &&
        ((profile.username && profile.username !== 'OPERATIVE' && profile.username !== 'Operative') ||
         (localCustomName && localCustomName !== 'OPERATIVE' && localCustomName !== 'Operative'))
      ) {
        finalUsername = (profile.username && profile.username !== 'OPERATIVE' && profile.username !== 'Operative')
          ? profile.username
          : localCustomName!;
        
        supabaseService.updateProfile(userId, { username: finalUsername }).catch(console.warn);
      }

      // One-time calibration to 50 Spidey Coins for this user
      const userCoinsResetKey = `web_ascend_coins_reset_to_50_user_${userId}`;
      if (!localStorage.getItem(userCoinsResetKey)) {
        localStorage.setItem(userCoinsResetKey, 'true');
        if (data.profile.currentEssence !== 50) {
          await supabaseService.calibrateSpideyCoins(userId, 50);
          data.profile.currentEssence = 50;
          data.profile.totalEssenceEarned = Math.max(50, data.profile.totalEssenceEarned);
          const currentSum = data.coinTransactions.reduce((acc, tx) => acc + tx.amount, 0);
          const delta = 50 - currentSum;
          if (delta !== 0) {
            data.coinTransactions = [
              {
                id: `cointx_reset_${Date.now()}`,
                amount: delta,
                source: 'INITIAL',
                description: 'Spidey Coins calibrated to 50',
                timestamp: Date.now(),
                date: todayDate,
              },
              ...data.coinTransactions,
            ];
          }
        }
      }

      const mergedProfile: UserProfile = {
        ...data.profile,
        username: finalUsername || 'OPERATIVE',
      };

      setProfile(mergedProfile);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(mergedProfile));
        if (finalUsername && finalUsername !== 'OPERATIVE' && finalUsername !== 'Operative') {
          localStorage.setItem('web_ascend_custom_username', finalUsername);
        }
      } catch {}

      setMissions(data.missions);
      setHabits(data.habits);

      // Merge daily records for today to protect in-flight and active toggles from being overwritten
      setDailyRecords((prev) => {
        const cloudRecords = data.dailyRecords || {};
        const localToday = prev[todayDate];
        const cloudToday = cloudRecords[todayDate];

        if (!localToday) {
          return cloudRecords;
        }

        const mergedMissions = Array.from(new Set([
          ...(cloudToday?.completedMissionIds || []),
          ...(localToday.completedMissionIds || []),
        ]));
        const mergedHabits = Array.from(new Set([
          ...(cloudToday?.completedHabitIds || []),
          ...(localToday.completedHabitIds || []),
        ]));

        const isSuccessful = !!(cloudToday?.isSuccessfulDay || localToday.isSuccessfulDay);

        return {
          ...cloudRecords,
          [todayDate]: {
            ...(cloudToday || localToday),
            completedMissionIds: mergedMissions,
            completedHabitIds: mergedHabits,
            isSuccessfulDay: isSuccessful,
            isPerfectDay: isSuccessful,
            status: isSuccessful ? 'PERFECT' : ((mergedMissions.length > 0 || mergedHabits.length > 0) ? 'PARTIAL' : 'IN_PROGRESS'),
          },
        };
      });

      setXpTransactions(data.xpTransactions);
      setEssenceTransactions(data.coinTransactions);
      setRewards(data.rewards);
      setPurchases(data.purchases);
      setNotifications(data.notifications);

      setSyncStatus('SYNCED');
      setIsMissingTablesError(false);

      // Check if local legacy data can be migrated
      const localProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const migratedKey = `web_ascend_migrated_${userId}`;
      const alreadyMigrated = localStorage.getItem(migratedKey);

      if (localProfile && !alreadyMigrated) {
        try {
          const parsed = JSON.parse(localProfile);
          if (parsed.totalSuccessfulDays > 0 || parsed.totalXP > 0 || parsed.username !== 'Operative') {
            setIsMigrationAvailable(true);
            setMigrationModalOpen(true);
          }
        } catch {}
      }
    } catch (err: any) {
      console.error('Failed to load cloud data from Supabase:', err);
      const msg = (err?.message || '').toLowerCase();
      if (
        msg.includes('public.profiles') ||
        msg.includes('schema cache') ||
        msg.includes('does not exist') ||
        msg.includes('relation')
      ) {
        setIsMissingTablesError(true);
      }
      setSyncStatus('OFFLINE');
    } finally {
      setDataLoading(false);
    }
  }, [todayDate]);

  const setUserAndSync = useCallback(
    async (newUser: any) => {
      if (newUser) {
        setUser(newUser);
        await loadCloudData(newUser.id);
      } else {
        setUser(null);
        setSyncStatus('LOCAL');
      }
    },
    [loadCloudData]
  );

  // Initialize Supabase Auth Listener (re-runs when configVersion changes)
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setAuthLoading(true);

      // Guard: if Supabase is unconfigured or blocked due to a secret key, stay in local mode safely
      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setUser(null);
          setSyncStatus('LOCAL');
          setAuthLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          setUser(session.user);
          await loadCloudData(session.user.id);
        } else if (isMounted) {
          setUser(null);
          setSyncStatus('LOCAL');
        }
      } catch (err) {
        console.warn('Auth session check notice:', err);
        if (isMounted) {
          setUser(null);
          setSyncStatus('LOCAL');
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }

      if (!isSupabaseConfigured()) return;

      // Listen to auth state updates on the active client instance
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
            setUser(session.user);
            await loadCloudData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSyncStatus('LOCAL');
            setProfile(createDefaultProfile(todayDate));
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [loadCloudData, todayDate, configVersion]);

  // Periodic or focus synchronization (throttled to avoid race conditions with local clicks/toggles)
  useEffect(() => {
    if (!user) return;
    const handleFocus = () => {
      if (Date.now() - lastSyncTimeRef.current > 120000 && syncStatus !== 'SYNCING') {
        loadCloudData(user.id, true);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loadCloudData, syncStatus]);

  // Notification helper
  const addNotification = useCallback(
    async (
      title: string,
      message: string,
      type: AppNotification['type']
    ) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title,
        message,
        type,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      if (user) {
        try {
          await supabase.from('notifications').insert({
            user_id: user.id,
            title,
            message,
            type,
          });
        } catch (err) {
          console.warn('Could not save notification to cloud:', err);
        }
      }
    },
    [user]
  );

  // Sign out handler
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSyncStatus('LOCAL');
      setProfile(createDefaultProfile(todayDate));
      setAccountModalOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, [todayDate]);

  // Local data migration to Supabase
  const importLocalDataToCloud = useCallback(async () => {
    if (!user) return;
    setIsMigrating(true);
    try {
      const localData: any = {};
      try {
        const p = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (p) localData.profile = JSON.parse(p);
        const m = localStorage.getItem(STORAGE_KEYS.MISSIONS);
        if (m) localData.missions = JSON.parse(m);
        const h = localStorage.getItem(STORAGE_KEYS.HABITS);
        if (h) localData.habits = JSON.parse(h);
        const r = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
        if (r) localData.dailyRecords = JSON.parse(r);
        const xp = localStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS);
        if (xp) localData.xpTransactions = JSON.parse(xp);
        const ess = localStorage.getItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS);
        if (ess) localData.essenceTransactions = JSON.parse(ess);
        const rew = localStorage.getItem(STORAGE_KEYS.REWARDS);
        if (rew) localData.rewards = JSON.parse(rew);
      } catch (readErr) {
        console.warn('Error reading local cache for migration:', readErr);
      }

      await supabaseService.migrateLocalData(user.id, localData);
      localStorage.setItem(`web_ascend_migrated_${user.id}`, 'true');
      setIsMigrationAvailable(false);
      setMigrationModalOpen(false);

      // Refresh cloud data
      await loadCloudData(user.id);
    } catch (err) {
      console.error('Migration failed:', err);
    } finally {
      setIsMigrating(false);
    }
  }, [user, loadCloudData]);

  const dismissMigration = useCallback(() => {
    if (user) {
      localStorage.setItem(`web_ascend_migrated_${user.id}`, 'true');
    }
    setIsMigrationAvailable(false);
    setMigrationModalOpen(false);
  }, [user]);

  // Toggle Mission Completion
  const toggleMissionCompletion = useCallback(
    async (missionId: string) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;

      const todayActiveMissions = missions.filter(
        (m) => m.isActive && getMissionDate(m) === todayDate
      );

      const todayRecord = dailyRecords[todayDate] || {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: todayActiveMissions.filter((m) => m.isRequired).length,
        totalActiveHabits: habits.filter((h) => h.isActive).length,
        status: 'IN_PROGRESS',
      };

      const isCurrentlyDone = todayRecord.completedMissionIds.includes(missionId);
      const missionXP = mission.xpReward || BASE_REWARDS.missionXP;
      const missionCoins = mission.essenceReward || BASE_REWARDS.missionEssence;

      if (isCurrentlyDone) {
        soundFX.playBlip();
      } else {
        soundFX.playComplete();
      }

      // Optimistic visual update
      const nextMissionIds = isCurrentlyDone
        ? todayRecord.completedMissionIds.filter((id) => id !== missionId)
        : [...todayRecord.completedMissionIds, missionId];

      const wasSuccessful = !!todayRecord.isSuccessfulDay;
      const isNowSuccessful = isSuccessfulConsistencyDay(
        nextMissionIds,
        todayRecord.completedHabitIds,
        todayActiveMissions,
        habits
      );

      // Calculate XP and Essence deltas (deduct on uncheck)
      let xpDelta = 0;
      let coinsDelta = 0;

      if (!isCurrentlyDone) {
        // Checking: grant rewards
        xpDelta += missionXP;
        coinsDelta += missionCoins;
        if (isNowSuccessful && !wasSuccessful) {
          xpDelta += BASE_REWARDS.perfectDayXP;
          coinsDelta += BASE_REWARDS.perfectDayEssence;
        }
      } else {
        // Unchecking: DEDUCT rewards
        xpDelta -= missionXP;
        coinsDelta -= missionCoins;
        if (wasSuccessful && !isNowSuccessful) {
          xpDelta -= BASE_REWARDS.perfectDayXP;
          coinsDelta -= BASE_REWARDS.perfectDayEssence;
        }
      }

      // Update Daily Records
      const updatedXpEarned = Math.max(0, (todayRecord.xpEarned || 0) + (isCurrentlyDone ? -missionXP : missionXP));
      const updatedCoinsEarned = Math.max(0, (todayRecord.essenceEarned || 0) + (isCurrentlyDone ? -missionCoins : missionCoins));

      setDailyRecords((prev) => ({
        ...prev,
        [todayDate]: {
          ...todayRecord,
          completedMissionIds: nextMissionIds,
          xpEarned: updatedXpEarned,
          essenceEarned: updatedCoinsEarned,
          isSuccessfulDay: isNowSuccessful,
          isPerfectDay: isNowSuccessful,
          status: isNowSuccessful ? 'PERFECT' : (nextMissionIds.length > 0 || todayRecord.completedHabitIds.length > 0 ? 'PARTIAL' : 'IN_PROGRESS'),
        },
      }));

      // Update Profile state (XP, Coins, Level, Rank progression)
      setProfile((prev) => {
        const newTotalXP = Math.max(0, prev.totalXP + xpDelta);
        const newCurrentEssence = Math.max(0, prev.currentEssence + coinsDelta);
        const newTotalEssenceEarned = Math.max(0, prev.totalEssenceEarned + coinsDelta);
        const computedLevel = getLevelProgress(newTotalXP).level;

        let newTotalDays = prev.totalSuccessfulDays;
        if (!wasSuccessful && isNowSuccessful) {
          newTotalDays += 1;
        } else if (wasSuccessful && !isNowSuccessful) {
          newTotalDays = Math.max(0, newTotalDays - 1);
        }
        const rankProg = getRankProgress(newTotalDays);

        return {
          ...prev,
          totalXP: newTotalXP,
          level: computedLevel,
          currentEssence: newCurrentEssence,
          totalEssenceEarned: newTotalEssenceEarned,
          totalSuccessfulDays: newTotalDays,
          consistencyDaysCompleted: newTotalDays,
          rank: rankProg.currentRank,
          successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
          requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
        };
      });

      // Update Ledger Transactions
      const now = Date.now();
      if (!isCurrentlyDone) {
        const newXpTx: XPTransaction = {
          id: `xptx_${now}_${Math.random().toString(36).substring(2, 7)}`,
          amount: missionXP,
          source: 'MISSION',
          sourceId: missionId,
          description: `Mission: ${mission.title}`,
          timestamp: now,
          date: todayDate,
        };
        const newCoinTx: EssenceTransaction = {
          id: `cointx_${now}_${Math.random().toString(36).substring(2, 7)}`,
          amount: missionCoins,
          source: 'MISSION',
          sourceId: missionId,
          description: `Mission: ${mission.title}`,
          timestamp: now,
          date: todayDate,
        };
        setXpTransactions((prev) => [newXpTx, ...prev]);
        setEssenceTransactions((prev) => [newCoinTx, ...prev]);

        if (isNowSuccessful && !wasSuccessful) {
          soundFX.playPerfectDay();
          setCelebration({
            type: 'PERFECT_DAY',
            data: {
              xp: BASE_REWARDS.perfectDayXP,
              essence: BASE_REWARDS.perfectDayEssence,
            },
          });
          addNotification('SUCCESSFUL DAY SECURED', 'All required daily directives and protocols completed! +1 Day added to Rank progression.', 'RANK_PROGRESS');
        }
      } else {
        // Unchecked: purge rewards from ledger (including Perfect Day bonus if day is no longer perfect)
        setXpTransactions((prev) => prev.filter((tx) => {
          if (tx.sourceId === missionId && tx.date === todayDate) return false;
          if (wasSuccessful && !isNowSuccessful && tx.source === 'PERFECT_DAY' && tx.date === todayDate) return false;
          return true;
        }));
        setEssenceTransactions((prev) => prev.filter((tx) => {
          if (tx.sourceId === missionId && tx.date === todayDate) return false;
          if (wasSuccessful && !isNowSuccessful && tx.source === 'PERFECT_DAY' && tx.date === todayDate) return false;
          return true;
        }));
      }

      // Cloud Persistence
      if (user) {
        setSyncStatus('SYNCING');
        try {
          await supabaseService.toggleMission(
            user.id,
            missionId,
            todayDate,
            mission,
            missions,
            habits,
            dailyRecords,
            !isCurrentlyDone
          );

          setSyncStatus('SYNCED');
        } catch (err) {
          console.error('Failed to toggle mission in Supabase:', err);
          setSyncStatus('OFFLINE');
        }
      }
    },
    [missions, habits, dailyRecords, todayDate, user, addNotification, loadCloudData]
  );

  // Toggle Habit Completion
  const toggleHabitCompletion = useCallback(
    async (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const todayActiveMissions = missions.filter(
        (m) => m.isActive && getMissionDate(m) === todayDate
      );

      const todayRecord = dailyRecords[todayDate] || {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: todayActiveMissions.filter((m) => m.isRequired).length,
        totalActiveHabits: habits.filter((h) => h.isActive).length,
        status: 'IN_PROGRESS',
      };

      const isCurrentlyDone = todayRecord.completedHabitIds.includes(habitId);
      const habitXP = habit.xpReward || BASE_REWARDS.habitXP;
      const habitCoins = habit.essenceReward || BASE_REWARDS.habitEssence;

      if (isCurrentlyDone) {
        soundFX.playBlip();
      } else {
        soundFX.playComplete();
      }

      const nextHabitIds = isCurrentlyDone
        ? todayRecord.completedHabitIds.filter((id) => id !== habitId)
        : [...todayRecord.completedHabitIds, habitId];

      const wasSuccessful = !!todayRecord.isSuccessfulDay;
      const isNowSuccessful = isSuccessfulConsistencyDay(
        todayRecord.completedMissionIds,
        nextHabitIds,
        todayActiveMissions,
        habits
      );

      // Calculate XP and Essence deltas (deduct on uncheck)
      let xpDelta = 0;
      let coinsDelta = 0;

      if (!isCurrentlyDone) {
        // Checking: grant rewards
        xpDelta += habitXP;
        coinsDelta += habitCoins;
        if (isNowSuccessful && !wasSuccessful) {
          xpDelta += BASE_REWARDS.perfectDayXP;
          coinsDelta += BASE_REWARDS.perfectDayEssence;
        }
      } else {
        // Unchecking: DEDUCT rewards
        xpDelta -= habitXP;
        coinsDelta -= habitCoins;
        if (wasSuccessful && !isNowSuccessful) {
          xpDelta -= BASE_REWARDS.perfectDayXP;
          coinsDelta -= BASE_REWARDS.perfectDayEssence;
        }
      }

      // Update habits streak
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          if (!isCurrentlyDone) {
            const nextStreak = (h.currentStreak || 0) + 1;
            return {
              ...h,
              currentStreak: nextStreak,
              longestStreak: Math.max(h.longestStreak || 0, nextStreak),
            };
          } else {
            return {
              ...h,
              currentStreak: Math.max(0, (h.currentStreak || 0) - 1),
            };
          }
        })
      );

      // Update Daily Records
      const updatedXpEarned = Math.max(0, (todayRecord.xpEarned || 0) + (isCurrentlyDone ? -habitXP : habitXP));
      const updatedCoinsEarned = Math.max(0, (todayRecord.essenceEarned || 0) + (isCurrentlyDone ? -habitCoins : habitCoins));

      setDailyRecords((prev) => ({
        ...prev,
        [todayDate]: {
          ...todayRecord,
          completedHabitIds: nextHabitIds,
          xpEarned: updatedXpEarned,
          essenceEarned: updatedCoinsEarned,
          isSuccessfulDay: isNowSuccessful,
          isPerfectDay: isNowSuccessful,
          status: isNowSuccessful ? 'PERFECT' : (todayRecord.completedMissionIds.length > 0 || nextHabitIds.length > 0 ? 'PARTIAL' : 'IN_PROGRESS'),
        },
      }));

      // Update Profile state (XP, Coins, Level, Rank progression)
      setProfile((prev) => {
        const newTotalXP = Math.max(0, prev.totalXP + xpDelta);
        const newCurrentEssence = Math.max(0, prev.currentEssence + coinsDelta);
        const newTotalEssenceEarned = Math.max(0, prev.totalEssenceEarned + coinsDelta);
        const computedLevel = getLevelProgress(newTotalXP).level;

        let newTotalDays = prev.totalSuccessfulDays;
        if (!wasSuccessful && isNowSuccessful) {
          newTotalDays += 1;
        } else if (wasSuccessful && !isNowSuccessful) {
          newTotalDays = Math.max(0, newTotalDays - 1);
        }
        const rankProg = getRankProgress(newTotalDays);

        return {
          ...prev,
          totalXP: newTotalXP,
          level: computedLevel,
          currentEssence: newCurrentEssence,
          totalEssenceEarned: newTotalEssenceEarned,
          totalSuccessfulDays: newTotalDays,
          consistencyDaysCompleted: newTotalDays,
          rank: rankProg.currentRank,
          successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
          requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
        };
      });

      // Update Ledger Transactions
      const now = Date.now();
      if (!isCurrentlyDone) {
        const newXpTx: XPTransaction = {
          id: `xptx_${now}_${Math.random().toString(36).substring(2, 7)}`,
          amount: habitXP,
          source: 'HABIT',
          sourceId: habitId,
          description: `Protocol: ${habit.name}`,
          timestamp: now,
          date: todayDate,
        };
        const newCoinTx: EssenceTransaction = {
          id: `cointx_${now}_${Math.random().toString(36).substring(2, 7)}`,
          amount: habitCoins,
          source: 'HABIT',
          sourceId: habitId,
          description: `Protocol: ${habit.name}`,
          timestamp: now,
          date: todayDate,
        };
        setXpTransactions((prev) => [newXpTx, ...prev]);
        setEssenceTransactions((prev) => [newCoinTx, ...prev]);

        if (isNowSuccessful && !wasSuccessful) {
          soundFX.playPerfectDay();
          setCelebration({
            type: 'PERFECT_DAY',
            data: {
              xp: BASE_REWARDS.perfectDayXP,
              essence: BASE_REWARDS.perfectDayEssence,
            },
          });
          addNotification('SUCCESSFUL DAY SECURED', 'All required daily directives and protocols completed! +1 Day added to Rank progression.', 'RANK_PROGRESS');
        }
      } else {
        // Unchecked: purge rewards from ledger (including Perfect Day bonus if day is no longer perfect)
        setXpTransactions((prev) => prev.filter((tx) => {
          if (tx.sourceId === habitId && tx.date === todayDate) return false;
          if (wasSuccessful && !isNowSuccessful && tx.source === 'PERFECT_DAY' && tx.date === todayDate) return false;
          return true;
        }));
        setEssenceTransactions((prev) => prev.filter((tx) => {
          if (tx.sourceId === habitId && tx.date === todayDate) return false;
          if (wasSuccessful && !isNowSuccessful && tx.source === 'PERFECT_DAY' && tx.date === todayDate) return false;
          return true;
        }));
      }

      // Cloud Persistence
      if (user) {
        setSyncStatus('SYNCING');
        try {
          await supabaseService.toggleHabit(
            user.id,
            habitId,
            todayDate,
            habit,
            missions,
            habits,
            dailyRecords,
            !isCurrentlyDone
          );

          setSyncStatus('SYNCED');
        } catch (err) {
          console.error('Failed to toggle habit in Supabase:', err);
          setSyncStatus('OFFLINE');
        }
      }
    },
    [habits, missions, dailyRecords, todayDate, user, addNotification, loadCloudData]
  );

  // Mission CRUD
  const createMission = useCallback(
    async (data: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'> & { date?: string }) => {
      soundFX.playBlip();
      const missionDate = data.date || todayDate;
      const missionPayload = {
        ...data,
        date: missionDate,
      };

      if (user) {
        setSyncStatus('SYNCING');
        try {
          const created = await supabaseService.createMission(user.id, missionPayload);
          if (created) {
            setMissions((prev) => [{ ...created, date: missionDate }, ...prev]);
            addNotification('MISSION INITIALIZED', `"${created.title}" assigned for today.`, 'SYSTEM');
            setSyncStatus('SYNCED');
          } else {
            const fallbackM: Mission = {
              ...missionPayload,
              id: `m_${Date.now()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            setMissions((prev) => [fallbackM, ...prev]);
            addNotification('MISSION INITIALIZED (LOCAL)', `"${data.title}" assigned for today.`, 'SYSTEM');
            setSyncStatus('SYNCED');
          }
        } catch (err) {
          console.error('Failed to save mission to cloud:', err);
          const fallbackM: Mission = {
            ...missionPayload,
            id: `m_${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setMissions((prev) => [fallbackM, ...prev]);
          setSyncStatus('OFFLINE');
        }
      } else {
        const newM: Mission = {
          ...missionPayload,
          id: `m_${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setMissions((prev) => [newM, ...prev]);
      }
    },
    [user, todayDate, addNotification]
  );

  const updateMission = useCallback(
    async (id: string, updates: Partial<Mission>) => {
      soundFX.playBlip();
      setMissions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m))
      );
      if (user) {
        try {
          await supabaseService.updateMission(user.id, id, updates);
        } catch (err) {
          console.error(err);
        }
      }
    },
    [user]
  );

  const deleteMission = useCallback(
    async (id: string) => {
      soundFX.playBlip();
      const target = missions.find((m) => m.id === id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
      setDailyRecords((prev) => {
        const todayRec = prev[todayDate];
        if (!todayRec || !todayRec.completedMissionIds.includes(id)) return prev;
        return {
          ...prev,
          [todayDate]: {
            ...todayRec,
            completedMissionIds: todayRec.completedMissionIds.filter((mId) => mId !== id),
          },
        };
      });
      if (target) {
        addNotification('MISSION DECOMMISSIONED', `"${target.title}" removed from active roster.`, 'SYSTEM');
      }
      if (user) {
        try {
          await supabaseService.deleteMission(user.id, id);
        } catch (err) {
          console.error('Error deleting mission from cloud:', err);
        }
      }
    },
    [user, missions, todayDate, addNotification]
  );

  // Habit CRUD
  const createHabit = useCallback(
    async (data: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => {
      soundFX.playBlip();
      if (user) {
        setSyncStatus('SYNCING');
        try {
          const created = await supabaseService.createHabit(user.id, data);
          if (created) {
            setHabits((prev) => [...prev, created]);
            addNotification('HABIT INITIALIZED', `"${created.name}" stored in cloud database.`, 'SYSTEM');
            setSyncStatus('SYNCED');
          } else {
            const fallbackH: Habit = {
              ...data,
              id: `h_${Date.now()}`,
              currentStreak: 0,
              longestStreak: 0,
              createdAt: Date.now(),
            };
            setHabits((prev) => [...prev, fallbackH]);
            addNotification('PROTOCOL INITIALIZED (LOCAL)', `"${data.name}" stored locally.`, 'SYSTEM');
            setSyncStatus('SYNCED');
          }
        } catch (err) {
          console.error('Failed to save habit to cloud:', err);
          const fallbackH: Habit = {
            ...data,
            id: `h_${Date.now()}`,
            currentStreak: 0,
            longestStreak: 0,
            createdAt: Date.now(),
          };
          setHabits((prev) => [...prev, fallbackH]);
          setSyncStatus('OFFLINE');
        }
      } else {
        const newH: Habit = {
          ...data,
          id: `h_${Date.now()}`,
          currentStreak: 0,
          longestStreak: 0,
          createdAt: Date.now(),
        };
        setHabits((prev) => [...prev, newH]);
      }
    },
    [user, addNotification]
  );

  const updateHabit = useCallback(
    async (id: string, updates: Partial<Habit>) => {
      soundFX.playBlip();
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
      if (user) {
        try {
          await supabaseService.updateHabit(user.id, id, updates);
        } catch (err) {
          console.error(err);
        }
      }
    },
    [user]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      soundFX.playBlip();
      const target = habits.find((h) => h.id === id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
      setDailyRecords((prev) => {
        const todayRec = prev[todayDate];
        if (!todayRec || !todayRec.completedHabitIds.includes(id)) return prev;
        return {
          ...prev,
          [todayDate]: {
            ...todayRec,
            completedHabitIds: todayRec.completedHabitIds.filter((hId) => hId !== id),
          },
        };
      });
      if (target) {
        addNotification('PROTOCOL DECOMMISSIONED', `"${target.name}" removed from active roster.`, 'SYSTEM');
      }
      if (user) {
        try {
          await supabaseService.deleteHabit(user.id, id);
        } catch (err) {
          console.error('Error deleting habit from cloud:', err);
        }
      }
    },
    [user, habits, todayDate, addNotification]
  );

  // Rewards Actions
  const purchaseReward = useCallback(
    async (rewardId: string): Promise<boolean> => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward) return false;

      if (profile.currentEssence < reward.essenceCost) {
        soundFX.playError();
        return false;
      }

      soundFX.playPurchase();

      if (user) {
        setSyncStatus('SYNCING');
        try {
          const res = await supabaseService.purchaseReward(user.id, reward);
          if (!res.success) {
            soundFX.playError();
            return false;
          }

          // Optimistically update local state
          const newPurchase: RewardPurchase = {
            id: `p_${Date.now()}`,
            rewardId: reward.id,
            rewardName: reward.name,
            cost: reward.essenceCost,
            timestamp: Date.now(),
            date: todayDate,
          };

          const newTx: EssenceTransaction = {
            id: `ess_${Date.now()}`,
            amount: -reward.essenceCost,
            source: 'PURCHASE',
            sourceId: reward.id,
            description: `Unlocked: ${reward.name}`,
            timestamp: Date.now(),
            date: todayDate,
          };

          setPurchases((prev) => [newPurchase, ...prev]);
          setEssenceTransactions((prev) => [newTx, ...prev]);
          setProfile((prev) => ({
            ...prev,
            currentEssence: Math.max(0, prev.currentEssence - reward.essenceCost),
          }));

          setCelebration({
            type: 'PURCHASE',
            data: { rewardName: reward.name, cost: reward.essenceCost },
          });

          addNotification('REWARD UNLOCKED', `Successfully redeemed ${reward.name} for ${reward.essenceCost} Spidey Coins.`, 'REWARD_UNLOCKED');
          setSyncStatus('SYNCED');
          return true;
        } catch (err) {
          console.error(err);
          setSyncStatus('OFFLINE');
          return false;
        }
      } else {
        // Local mode purchase
        setProfile((prev) => ({
          ...prev,
          currentEssence: prev.currentEssence - reward.essenceCost,
        }));
        setPurchases((prev) => [
          {
            id: `p_${Date.now()}`,
            rewardId: reward.id,
            rewardName: reward.name,
            cost: reward.essenceCost,
            timestamp: Date.now(),
            date: todayDate,
          },
          ...prev,
        ]);
        return true;
      }
    },
    [rewards, profile.currentEssence, user, todayDate, addNotification]
  );

  const createReward = useCallback(
    async (reward: Omit<Reward, 'id' | 'createdAt'>) => {
      soundFX.playBlip();
      if (user) {
        setSyncStatus('SYNCING');
        try {
          const created = await supabaseService.createReward(user.id, reward);
          if (created) {
            setRewards((prev) => [created, ...prev]);
            addNotification('REWARD INITIALIZED', `"${created.name}" stored in cloud market.`, 'SYSTEM');
            setSyncStatus('SYNCED');
          } else {
            const fallbackR: Reward = {
              ...reward,
              id: `r_${Date.now()}`,
              createdAt: Date.now(),
            };
            setRewards((prev) => [fallbackR, ...prev]);
            addNotification('REWARD INITIALIZED (LOCAL)', `"${reward.name}" stored locally.`, 'SYSTEM');
            setSyncStatus('SYNCED');
          }
        } catch (err) {
          console.error('Failed to create reward:', err);
          const fallbackR: Reward = {
            ...reward,
            id: `r_${Date.now()}`,
            createdAt: Date.now(),
          };
          setRewards((prev) => [fallbackR, ...prev]);
          setSyncStatus('OFFLINE');
        }
      } else {
        setRewards((prev) => [{ ...reward, id: `r_${Date.now()}`, createdAt: Date.now() }, ...prev]);
      }
    },
    [user, addNotification]
  );

  const updateReward = useCallback(
    async (id: string, updates: Partial<Reward>) => {
      soundFX.playBlip();
      setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      if (user) {
        try {
          await supabaseService.updateReward(user.id, id, updates);
        } catch (err) {
          console.error(err);
        }
      }
    },
    [user]
  );

  const deleteReward = useCallback(
    async (id: string) => {
      soundFX.playBlip();
      const target = rewards.find((r) => r.id === id);
      const nextRewards = rewards.filter((r) => r.id !== id);
      setRewards(nextRewards);
      try {
        localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(nextRewards));
      } catch {}
      if (target) {
        addNotification('REWARD REMOVED', `"${target.name}" removed from market roster.`, 'SYSTEM');
      }
      if (user) {
        try {
          await supabaseService.deleteReward(user.id, id, target?.name);
        } catch (err) {
          console.error('Error deleting reward from cloud:', err);
        }
      }
    },
    [user, rewards, addNotification]
  );

  // Profile Updates
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      soundFX.playBlip();
      setProfile((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
          if (next.username && next.username !== 'OPERATIVE' && next.username !== 'Operative') {
            localStorage.setItem('web_ascend_custom_username', next.username);
          }
        } catch {}
        return next;
      });
      if (user) {
        await supabaseService.updateProfile(user.id, {
          username: updates.username,
          sound_enabled: updates.soundEnabled,
        });
      }
    },
    [user]
  );

  const initializeProfile = useCallback(
    (username: string) => {
      const cleanName = username.trim() || 'OPERATIVE';
      localStorage.setItem('web_ascend_onboarding_completed', 'true');
      if (cleanName !== 'OPERATIVE' && cleanName !== 'Operative') {
        localStorage.setItem('web_ascend_custom_username', cleanName);
      }
      setProfile((prev) => {
        const next = { ...prev, username: cleanName };
        try {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
        } catch {}
        return next;
      });
      if (user) {
        supabaseService.updateProfile(user.id, { username: cleanName }).catch(console.warn);
      }
    },
    [user]
  );

  const toggleSound = useCallback(() => {
    soundFX.toggleSound();
    setProfile((prev) => {
      const nextVal = !prev.soundEnabled;
      if (user) {
        supabaseService.updateProfile(user.id, { sound_enabled: nextVal });
      }
      return { ...prev, soundEnabled: nextVal };
    });
  }, [user]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (user) {
        await supabaseService.markNotificationRead(user.id, id);
      }
    },
    [user]
  );

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    if (user) {
      await supabaseService.clearNotifications(user.id);
    }
  }, [user]);

  const closeCelebration = useCallback(() => {
    setCelebration({ type: null });
  }, []);

  const refreshCloudData = useCallback(async () => {
    if (user) {
      await loadCloudData(user.id);
    }
  }, [user, loadCloudData]);

  // Complete Operative Factory Reset
  const reinitializeOperative = useCallback(async () => {
    soundFX.playRankUp();
    // Preserve custom codename so user does not get reverted back to generic 'OPERATIVE'
    const preservedUsername = (profile.username && profile.username !== 'OPERATIVE' && profile.username !== 'Operative')
      ? profile.username
      : localStorage.getItem('web_ascend_custom_username') || 'OPERATIVE';

    const cleanProfile = createDefaultProfile(todayDate, preservedUsername);

    const cleanMissions: Mission[] = STARTER_MISSIONS.map((m, idx) => ({
      ...m,
      id: `m_${idx + 1}`,
      createdAt: Date.now() - (4 - idx) * 86400000,
      updatedAt: Date.now(),
    }));

    const cleanHabits: Habit[] = STARTER_HABITS.map((h, idx) => ({
      ...h,
      id: `h_${idx + 1}`,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: Date.now(),
    }));

    const cleanDailyRecords: Record<string, DailyRecord> = {
      [todayDate]: {
        date: todayDate,
        completedMissionIds: [],
        completedHabitIds: [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: cleanMissions.filter((m) => m.isRequired && m.isActive).length,
        totalActiveHabits: cleanHabits.filter((h) => h.isActive).length,
        status: 'IN_PROGRESS',
      },
    };

    const cleanRewards: Reward[] = DEFAULT_REWARDS.map((r, idx) => ({
      ...r,
      id: `r_${idx + 1}`,
      createdAt: Date.now() - idx * 86400000,
    }));

    const cleanNotifs: AppNotification[] = [
      {
        id: `notif_${Date.now()}`,
        title: 'OPERATIVE RE-INITIALIZED',
        message: 'Directives, protocols, ledger, and streaks have been reset to factory specifications.',
        type: 'SYSTEM',
        timestamp: Date.now(),
        read: false,
      },
    ];

    const startingCoinTx: EssenceTransaction = {
      id: `cointx_init_${Date.now()}`,
      amount: 50,
      source: 'INITIAL',
      description: 'Starter Operative Allowance',
      timestamp: Date.now(),
      date: todayDate,
    };

    // 1. Update React states immediately
    setProfile(cleanProfile);
    setMissions(cleanMissions);
    setHabits(cleanHabits);
    setDailyRecords(cleanDailyRecords);
    setXpTransactions([]);
    setEssenceTransactions([startingCoinTx]);
    setRewards(cleanRewards);
    setPurchases([]);
    setNotifications(cleanNotifs);

    // 2. Overwrite all local storage keys completely
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(cleanProfile));
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(cleanMissions));
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(cleanHabits));
      localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(cleanDailyRecords));
      localStorage.setItem(STORAGE_KEYS.XP_TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS, JSON.stringify([startingCoinTx]));
      localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(cleanRewards));
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cleanNotifs));
    } catch (e) {
      console.warn('LocalStorage wipe warning:', e);
    }

    // 3. If connected to Supabase cloud, wipe cloud tables and re-populate
    if (user) {
      setDataLoading(true);
      try {
        await supabaseService.reinitializeUser(user.id, preservedUsername);
        await loadCloudData(user.id);
      } catch (err) {
        console.error('Failed to reinitialize cloud user in Supabase:', err);
      } finally {
        setDataLoading(false);
      }
    }
  }, [todayDate, profile.username, user, loadCloudData]);

  // Calibrate / Reset Spidey Coins to target value (default 50)
  const setSpideyCoins = useCallback(
    async (targetAmount: number = 50) => {
      soundFX.playClaim();
      setProfile((prev) => {
        const next = {
          ...prev,
          currentEssence: targetAmount,
          totalEssenceEarned: Math.max(targetAmount, prev.totalEssenceEarned),
        };
        try {
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
        } catch {}
        return next;
      });

      setEssenceTransactions((prev) => {
        const currentSum = prev.reduce((acc, tx) => acc + tx.amount, 0);
        const delta = targetAmount - currentSum;
        if (delta === 0) return prev;
        const resetTx: EssenceTransaction = {
          id: `cointx_reset_${Date.now()}`,
          amount: delta,
          source: 'INITIAL',
          description: `Balance Calibration: Reset to ${targetAmount} Spidey Coins`,
          timestamp: Date.now(),
          date: todayDate,
        };
        const updated = [resetTx, ...prev];
        try {
          localStorage.setItem(STORAGE_KEYS.ESSENCE_TRANSACTIONS, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      addNotification(
        'COINS CALIBRATED',
        `Spidey Coins balance has been calibrated to ${targetAmount}.`,
        'SYSTEM'
      );

      if (user) {
        try {
          await supabaseService.calibrateSpideyCoins(user.id, targetAmount);
          setSyncStatus('SYNCED');
        } catch (err) {
          console.warn('Failed to calibrate coins in Supabase:', err);
        }
      }
    },
    [todayDate, user, addNotification]
  );

  // Auto-reset Spidey Coins to 50 on initial load
  useEffect(() => {
    const RESET_KEY = 'web_ascend_coins_reset_to_50_v2';
    if (!localStorage.getItem(RESET_KEY)) {
      localStorage.setItem(RESET_KEY, 'true');
      setSpideyCoins(50);
    }
  }, [setSpideyCoins]);

  // Simulation helpers
  const resetTestProgression = useCallback(() => {
    setProfile((prev) => {
      const next = {
        ...prev,
        rank: 'E' as RankTier,
        successfulDaysForCurrentRank: 0,
        requiredSuccessfulDaysForCurrentRank: 180,
        totalSuccessfulDays: 0,
        consistencyDaysCompleted: 0,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const simulateSuccessfulDay = useCallback(() => {
    soundFX.playPerfectDay();
    setProfile((prev) => {
      const nextDays = prev.totalSuccessfulDays + 1;
      const rankProg = getRankProgress(nextDays);
      return {
        ...prev,
        totalSuccessfulDays: nextDays,
        consistencyDaysCompleted: nextDays,
        rank: rankProg.currentRank,
        successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
        requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
        currentStreak: prev.currentStreak + 1,
      };
    });
  }, []);

  const simulateTierAscension = useCallback(() => {
    soundFX.playRankUp();
    setProfile((prev) => {
      const curIdx = RANK_ORDER.indexOf(prev.rank);
      const nextRank = RANK_ORDER[Math.min(RANK_ORDER.length - 1, curIdx + 1)];
      return {
        ...prev,
        rank: nextRank,
        successfulDaysForCurrentRank: 0,
      };
    });
  }, []);

  const triggerAscendSimulation = simulateTierAscension;

  // Advance simulation to the next calendar day to demonstrate one-day mission lifecycle
  const simulateNextDay = useCallback(() => {
    soundFX.playLevelUp();
    const currentDateObj = parseDateString(todayDate);
    const nextDateObj = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), currentDateObj.getDate() + 1);
    const nextDateStr = formatDateString(nextDateObj);

    setTodayDate(nextDateStr);

    setDailyRecords((prev) => {
      if (prev[nextDateStr]) return prev;
      return {
        ...prev,
        [nextDateStr]: {
          date: nextDateStr,
          completedMissionIds: [],
          completedHabitIds: [],
          isSuccessfulDay: false,
          isPerfectDay: false,
          xpEarned: 0,
          essenceEarned: 0,
          totalRequiredMissions: 0,
          totalActiveHabits: habits.filter((h) => h.isActive).length,
          status: 'IN_PROGRESS',
        },
      };
    });

    addNotification(
      'NEXT DAY CYCLE SIMULATED',
      `Date advanced to ${formatReadableDate(nextDateStr)}. Previous day's missions have vanished. Habits reset for the new cycle.`,
      'SYSTEM'
    );
  }, [todayDate, habits, addNotification]);

  const jumpToCurrentDate = useCallback(() => {
    const current = getTodayDateString();
    setTodayDate(current);
    addNotification('CALENDAR SYNCHRONIZED', `Synchronized to current real-world date: ${formatReadableDate(current)}.`, 'SYSTEM');
  }, [addNotification]);

  const todayMissions = useMemo(() => {
    return missions.filter((m) => {
      if (!m.isActive) return false;
      const mDate = getMissionDate(m);
      return mDate === todayDate;
    });
  }, [missions, todayDate]);

  const resetAllData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const exportData = useCallback((): string => {
    const backup = {
      profile,
      missions,
      habits,
      dailyRecords,
      xpTransactions,
      essenceTransactions,
      rewards,
      purchases,
      version: '3.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  }, [profile, missions, habits, dailyRecords, xpTransactions, essenceTransactions, rewards, purchases]);

  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.missions) setMissions(parsed.missions);
      if (parsed.habits) setHabits(parsed.habits);
      if (parsed.dailyRecords) setDailyRecords(parsed.dailyRecords);
      if (parsed.xpTransactions) setXpTransactions(parsed.xpTransactions);
      if (parsed.essenceTransactions) setEssenceTransactions(parsed.essenceTransactions);
      if (parsed.rewards) setRewards(parsed.rewards);
      if (parsed.purchases) setPurchases(parsed.purchases);
      return true;
    } catch {
      return false;
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      authLoading,
      dataLoading,
      syncStatus,
      isSupabaseReady: isSupabaseConfigured(),
      hasSecretKeyError: hasSecretKeyConfigured(),
      isMissingTablesError,
      checkMissingTables,
      authModalOpen,
      setAuthModalOpen,
      supabaseConfigModalOpen,
      setSupabaseConfigModalOpen,
      accountModalOpen,
      setAccountModalOpen,
      migrationModalOpen,
      setMigrationModalOpen,
      isMigrationAvailable,
      importLocalDataToCloud,
      dismissMigration,
      signOut,
      profile,
      missions,
      todayMissions,
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
      addNotification,
      markNotificationRead,
      clearNotifications,
      refreshCloudData,
      reloadAuthAndConfig,
      setUserAndSync,
      setSpideyCoins,
      reinitializeOperative,
      resetTestProgression,
      simulateSuccessfulDay,
      simulateTierAscension,
      triggerAscendSimulation,
      simulateNextDay,
      jumpToCurrentDate,
      resetAllData,
      exportData,
      importData,
    }),
    [
      user,
      authLoading,
      dataLoading,
      syncStatus,
      isMissingTablesError,
      checkMissingTables,
      authModalOpen,
      supabaseConfigModalOpen,
      accountModalOpen,
      migrationModalOpen,
      isMigrationAvailable,
      importLocalDataToCloud,
      dismissMigration,
      signOut,
      profile,
      missions,
      todayMissions,
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
      addNotification,
      markNotificationRead,
      clearNotifications,
      refreshCloudData,
      reloadAuthAndConfig,
      setUserAndSync,
      setSpideyCoins,
      reinitializeOperative,
      resetTestProgression,
      simulateSuccessfulDay,
      simulateTierAscension,
      triggerAscendSimulation,
      simulateNextDay,
      jumpToCurrentDate,
      resetAllData,
      exportData,
      importData,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
