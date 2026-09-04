import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, isSecretApiKey, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
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
  RankTier,
} from '../types';
import {
  STARTER_MISSIONS,
  STARTER_HABITS,
  DEFAULT_REWARDS,
  BASE_REWARDS,
  getRankProgress,
  getLevelProgress,
  RANK_ORDER,
} from '../config/progression';
import { calculateStreaks } from '../utils/date';

export interface CloudDataPayload {
  profile: UserProfile;
  missions: Mission[];
  habits: Habit[];
  dailyRecords: Record<string, DailyRecord>;
  xpTransactions: XPTransaction[];
  coinTransactions: EssenceTransaction[];
  rewards: Reward[];
  purchases: RewardPurchase[];
  notifications: AppNotification[];
}

export const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const supabaseService = {
  /**
   * Check if Supabase connection is healthy
   */
  async testConnection(customUrl?: string, customKey?: string): Promise<{ ok: boolean; isMissingTables?: boolean; error?: string }> {
    const url = customUrl !== undefined ? customUrl.trim() : (isSupabaseConfigured() ? SUPABASE_URL : '');
    const key = customKey !== undefined ? customKey.trim() : (isSupabaseConfigured() ? SUPABASE_ANON_KEY : '');

    if (!url || !key) {
      return { ok: false, error: 'Project URL and Anon API Key are required.' };
    }

    if (isSecretApiKey(key)) {
      return {
        ok: false,
        error: 'Forbidden use of secret API key in browser: The provided key has the "service_role" secret role. Supabase strictly forbids secret keys in web browsers. Please copy the "anon" public key from Project Settings -> API.',
      };
    }

    try {
      const client = (customUrl && customKey) ? createClient(url, key) : supabase;

      // 1. Verify network and project reachability
      try {
        const { error: authErr } = await client.auth.getSession();
        if (authErr && !authErr.message?.toLowerCase().includes('session')) {
          return { ok: false, error: `Auth connection failed: ${authErr.message}` };
        }
      } catch (authCatchErr: any) {
        return { ok: false, error: `Network error reaching Supabase: ${authCatchErr?.message || 'Check Project URL'}` };
      }

      // 2. Query profiles table to verify PostgreSQL REST API & Schema Cache
      const { error } = await client.from('profiles').select('id').limit(1);
      if (error) {
        const errorMsg = error.message || '';
        const lower = errorMsg.toLowerCase();
        const isMissing =
          lower.includes('public.profiles') ||
          lower.includes('schema cache') ||
          lower.includes('does not exist') ||
          lower.includes('relation') ||
          error.code === 'PGRST205' ||
          error.code === '42P01';

        if (isMissing) {
          return {
            ok: false,
            isMissingTables: true,
            error: `PostgREST schema cache has not registered 'public.profiles' (Code: ${error.code || 'PGRST205'}). Run the quick schema reload & permissions script in Supabase SQL editor.`,
          };
        }

        if (error.code !== 'PGRST116') {
          return { ok: false, error: `Postgres query error: ${error.message}` };
        }
      }
      return { ok: true };
    } catch (err: any) {
      const errorMsg = err?.message || 'Connection failed.';
      const lower = errorMsg.toLowerCase();
      const isMissing =
        lower.includes('public.profiles') ||
        lower.includes('schema cache') ||
        lower.includes('does not exist') ||
        lower.includes('relation');

      if (isMissing) {
        return {
          ok: false,
          isMissingTables: true,
          error: "Could not find the table 'public.profiles' in the schema cache. Your Supabase URL and Key are connected successfully, but the database tables need to be created.",
        };
      }
      return { ok: false, error: errorMsg };
    }
  },

  /**
   * Initialize a new user in Supabase with starter entities
   */
  async initializeNewUser(userId: string, username: string = 'OPERATIVE'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // 1. Profile
    await supabase.from('profiles').upsert({
      user_id: userId,
      username: username.trim() || 'OPERATIVE',
      sound_enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // 2. Level Progression (Level 1)
    await supabase.from('level_progression').upsert({
      user_id: userId,
      current_level: 1,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // 3. Rank Progression (Rank E, 0 / 180)
    await supabase.from('rank_progression').upsert({
      user_id: userId,
      current_rank: 'E',
      successful_days_for_current_rank: 0,
      required_successful_days: 180,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // 4. Starter Missions
    const { data: existingMissions } = await supabase
      .from('missions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingMissions || existingMissions.length === 0) {
      const missionPayloads = STARTER_MISSIONS.map((m) => ({
        user_id: userId,
        title: m.title,
        description: m.description || '',
        priority: m.priority,
        xp_reward: m.xpReward,
        spidey_coin_reward: m.essenceReward,
        required: m.isRequired,
        active: m.isActive,
      }));
      await supabase.from('missions').insert(missionPayloads);
    }

    // 5. Starter Habits
    const { data: existingHabits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingHabits || existingHabits.length === 0) {
      const habitPayloads = STARTER_HABITS.map((h) => ({
        user_id: userId,
        name: h.name,
        description: h.description || '',
        frequency: 'DAILY',
        xp_reward: h.xpReward,
        spidey_coin_reward: h.essenceReward,
        active: h.isActive,
      }));
      await supabase.from('habits').insert(habitPayloads);
    }

    // 6. Starter Rewards
    const { data: existingRewards } = await supabase
      .from('rewards')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingRewards || existingRewards.length === 0) {
      const rewardPayloads = DEFAULT_REWARDS.map((r) => ({
        user_id: userId,
        name: r.name,
        description: r.description || '',
        cost: r.essenceCost,
        icon: r.icon,
        active: r.isActive,
      }));
      await supabase.from('rewards').insert(rewardPayloads);
    }

    // 7. Initial Notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'SYSTEM INITIALIZED',
      message: `Welcome to WEB ASCEND, ${username}. Initialized at Rank E. Complete all required daily directives and protocols to ascend.`,
      type: 'SYSTEM',
    });
  },

  /**
   * Fetch all user data from cloud database
   */
  async fetchAllUserData(userId: string, todayDate: string): Promise<CloudDataPayload> {
    // 1. Fetch Profile
    let { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profileRow) {
      try {
        await this.initializeNewUser(userId, 'OPERATIVE');
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (p) profileRow = p;
      } catch (e) {
        console.warn('Auto-init new user notice:', e);
      }
    }

    // 2. Fetch Level Progression
    const { data: levelRow } = await supabase
      .from('level_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 3. Fetch Rank Progression
    const { data: rankRow } = await supabase
      .from('rank_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 4. Fetch Missions
    let { data: missionsRows } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // 5. Fetch Habits
    let { data: habitsRows } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // 6. Fetch Daily Progress
    const { data: dailyProgressRows } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId);

    // 7. Fetch Mission Completions
    const { data: missionCompletionsRows } = await supabase
      .from('mission_completions')
      .select('*')
      .eq('user_id', userId);

    // 8. Fetch Habit Completions
    const { data: habitCompletionsRows } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId);

    // 9. Fetch XP Transactions
    const { data: xpTxRows } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 10. Fetch Spidey Coin Transactions
    const { data: coinTxRows } = await supabase
      .from('spidey_coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 11. Fetch Rewards
    let { data: rewardsRows } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // Auto-seed rewards if empty
    if (!rewardsRows || rewardsRows.length === 0) {
      try {
        const rewardPayloads = DEFAULT_REWARDS.map((r) => ({
          user_id: userId,
          name: r.name,
          description: r.description || '',
          cost: r.essenceCost,
          icon: r.icon,
          active: r.isActive,
        }));
        const { data: seededR } = await supabase.from('rewards').insert(rewardPayloads).select();
        if (seededR && seededR.length > 0) {
          rewardsRows = seededR;
        }
      } catch (err) {
        console.warn('Seeding rewards notice:', err);
      }
    }

    // 12. Fetch Reward Purchases
    const { data: purchasesRows } = await supabase
      .from('reward_purchases')
      .select('*, rewards(name)')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    // 13. Fetch Notifications
    const { data: notifRows } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Transform Missions
    const missions: Mission[] = (missionsRows || []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description || '',
      priority: m.priority,
      xpReward: m.xp_reward,
      essenceReward: m.spidey_coin_reward,
      isRequired: m.required,
      isActive: m.active,
      createdAt: new Date(m.created_at).getTime(),
      updatedAt: new Date(m.updated_at).getTime(),
    }));

    // Transform Habits
    const habits: Habit[] = (habitsRows || []).map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description || '',
      xpReward: h.xp_reward,
      essenceReward: h.spidey_coin_reward,
      isActive: h.active,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: new Date(h.created_at).getTime(),
    }));

    // Group completions by date for daily records
    const missionCompletionsByDate: Record<string, string[]> = {};
    (missionCompletionsRows || []).forEach((mc) => {
      if (!missionCompletionsByDate[mc.completion_date]) {
        missionCompletionsByDate[mc.completion_date] = [];
      }
      missionCompletionsByDate[mc.completion_date].push(mc.mission_id);
    });

    const habitCompletionsByDate: Record<string, string[]> = {};
    (habitCompletionsRows || []).forEach((hc) => {
      if (!habitCompletionsByDate[hc.completion_date]) {
        habitCompletionsByDate[hc.completion_date] = [];
      }
      habitCompletionsByDate[hc.completion_date].push(hc.habit_id);
    });

    // Construct Daily Records
    const dailyRecords: Record<string, DailyRecord> = {};
    (dailyProgressRows || []).forEach((dp) => {
      dailyRecords[dp.date] = {
        date: dp.date,
        completedMissionIds: missionCompletionsByDate[dp.date] || [],
        completedHabitIds: habitCompletionsByDate[dp.date] || [],
        isSuccessfulDay: dp.is_successful_day,
        isPerfectDay: dp.is_perfect_day,
        xpEarned: dp.xp_earned,
        essenceEarned: dp.spidey_coins_earned,
        totalRequiredMissions: dp.required_missions_total,
        totalActiveHabits: dp.habits_total,
        status: dp.is_successful_day ? 'PERFECT' : (dp.required_missions_completed > 0 ? 'PARTIAL' : 'IN_PROGRESS'),
      };
    });

    // Ensure today's record exists
    if (!dailyRecords[todayDate]) {
      const activeReqCount = missions.filter((m) => m.isActive && m.isRequired).length;
      const activeHabitCount = habits.filter((h) => h.isActive).length;
      dailyRecords[todayDate] = {
        date: todayDate,
        completedMissionIds: missionCompletionsByDate[todayDate] || [],
        completedHabitIds: habitCompletionsByDate[todayDate] || [],
        isSuccessfulDay: false,
        isPerfectDay: false,
        xpEarned: 0,
        essenceEarned: 0,
        totalRequiredMissions: activeReqCount,
        totalActiveHabits: activeHabitCount,
        status: 'IN_PROGRESS',
      };
    }

    // Transform XP Transactions & compute total XP
    const xpTransactions: XPTransaction[] = (xpTxRows || []).map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      source: tx.source_type as XPTransaction['source'],
      sourceId: tx.source_id || undefined,
      description: `${tx.source_type} XP`,
      timestamp: new Date(tx.created_at).getTime(),
      date: tx.transaction_date,
    }));

    const totalXP = xpTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    const computedLevel = getLevelProgress(totalXP).level;

    // Transform Coin Transactions & compute current balance and lifetime earned
    const coinTransactions: EssenceTransaction[] = (coinTxRows || []).map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      source: tx.source_type as EssenceTransaction['source'],
      sourceId: tx.source_id || undefined,
      description: tx.description,
      timestamp: new Date(tx.created_at).getTime(),
      date: new Date(tx.created_at).toISOString().split('T')[0],
    }));

    const currentCoins = coinTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    const totalCoinsEarned = coinTransactions
      .filter((tx) => tx.amount > 0)
      .reduce((acc, tx) => acc + tx.amount, 0);

    // Calculate streaks from historical records
    const { currentStreak, longestStreak } = calculateStreaks(dailyRecords, todayDate);

    // Calculate total successful days strictly from history (max 1 per calendar day)
    const totalSuccessfulDays = Object.values(dailyRecords).filter((r) => r.isSuccessfulDay).length;
    const rankProg = getRankProgress(totalSuccessfulDays);

    // Transform Rewards
    const rewards: Reward[] = (rewardsRows || []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      essenceCost: r.cost,
      icon: r.icon,
      isActive: r.active,
      createdAt: new Date(r.created_at).getTime(),
    }));

    // Transform Purchases
    const purchases: RewardPurchase[] = (purchasesRows || []).map((p) => ({
      id: p.id,
      rewardId: p.reward_id,
      rewardName: (p as any).rewards?.name || 'Reward',
      cost: p.cost,
      timestamp: new Date(p.purchased_at).getTime(),
      date: new Date(p.purchased_at).toISOString().split('T')[0],
    }));

    // Transform Notifications
    const notifications: AppNotification[] = (notifRows || []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as AppNotification['type'],
      timestamp: new Date(n.created_at).getTime(),
      read: n.read,
    }));

    // Build UserProfile
    const profile: UserProfile = {
      username: profileRow?.username || 'OPERATIVE',
      level: Math.max(computedLevel, levelRow?.current_level || 1),
      rank: (rankRow?.current_rank as RankTier) || rankProg.currentRank,
      successfulDaysForCurrentRank: rankProg.successfulDaysForCurrentRank,
      requiredSuccessfulDaysForCurrentRank: rankProg.requiredSuccessfulDaysForCurrentRank,
      totalSuccessfulDays,
      consistencyDaysCompleted: totalSuccessfulDays,
      totalXP,
      currentEssence: Math.max(0, currentCoins),
      totalEssenceEarned: totalCoinsEarned,
      currentStreak,
      longestStreak,
      soundEnabled: profileRow?.sound_enabled ?? true,
      initialized: true,
      joinedDate: profileRow?.created_at ? new Date(profileRow.created_at).toISOString().split('T')[0] : todayDate,
      lastActiveDate: todayDate,
      avatarIcon: profileRow?.avatar_icon || 'SpiderIcon',
      rpgStats: {
        discipline: 20 + Math.min(60, totalSuccessfulDays * 2),
        focus: 20 + Math.min(60, Math.floor(totalXP / 100)),
        strength: 20 + Math.min(60, Math.floor(totalXP / 150)),
        intelligence: 20 + Math.min(60, Math.floor(totalCoinsEarned / 100)),
        consistency: 20 + Math.min(60, currentStreak * 5),
      },
    };

    return {
      profile,
      missions,
      habits,
      dailyRecords,
      xpTransactions,
      coinTransactions,
      rewards,
      purchases,
      notifications,
    };
  },

  /**
   * Toggle Mission Completion
   * Prevents duplicate rewards when toggled repeatedly.
   */
  async toggleMission(
    userId: string,
    missionId: string,
    date: string,
    mission: Mission,
    allMissions: Mission[],
    allHabits: Habit[],
    todayRecords: Record<string, DailyRecord>
  ): Promise<{
    completed: boolean;
    xpDelta: number;
    coinsDelta: number;
    isSuccessfulDay: boolean;
  }> {
    const xpReward = mission.xpReward || BASE_REWARDS.missionXP;
    const coinsReward = mission.essenceReward || BASE_REWARDS.missionEssence;

    let existing = false;
    let existingId: string | null = null;

    if (isUUID(missionId)) {
      const { data } = await supabase
        .from('mission_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('mission_id', missionId)
        .eq('completion_date', date)
        .maybeSingle();
      if (data) {
        existing = true;
        existingId = data.id;
      }
    } else {
      existing = !!todayRecords[date]?.completedMissionIds?.includes(missionId);
    }

    let completed = false;
    let xpDelta = 0;
    let coinsDelta = 0;

    if (existing) {
      // Uncomplete: Remove completion record and revoke XP & Coin transactions
      if (isUUID(missionId) && existingId) {
        await supabase
          .from('mission_completions')
          .delete()
          .eq('id', existingId);

        await supabase
          .from('xp_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'MISSION')
          .eq('source_id', missionId)
          .eq('transaction_date', date);

        await supabase
          .from('spidey_coin_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'MISSION')
          .eq('source_id', missionId);
      }

      completed = false;
      xpDelta = -xpReward;
      coinsDelta = -coinsReward;
    } else {
      // Complete: Insert completion record & award XP and Coins
      if (isUUID(missionId)) {
        await supabase.from('mission_completions').insert({
          user_id: userId,
          mission_id: missionId,
          completion_date: date,
          reward_granted: true,
        });

        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: xpReward,
          source_type: 'MISSION',
          source_id: missionId,
          transaction_date: date,
        });

        await supabase.from('spidey_coin_transactions').insert({
          user_id: userId,
          amount: coinsReward,
          transaction_type: 'EARNED',
          source_type: 'MISSION',
          source_id: missionId,
          description: `Completed: ${mission.title}`,
        });
      }

      completed = true;
      xpDelta = xpReward;
      coinsDelta = coinsReward;
    }

    // Recalculate daily progress
    const isSuccessfulDay = await this.syncDailyProgress(userId, date, allMissions, allHabits);

    return { completed, xpDelta, coinsDelta, isSuccessfulDay };
  },

  /**
   * Toggle Habit Completion
   * Adds or revokes rewards cleanly upon check/uncheck.
   */
  async toggleHabit(
    userId: string,
    habitId: string,
    date: string,
    habit: Habit,
    allMissions: Mission[],
    allHabits: Habit[],
    todayRecords: Record<string, DailyRecord>
  ): Promise<{
    completed: boolean;
    xpDelta: number;
    coinsDelta: number;
    isSuccessfulDay: boolean;
  }> {
    const xpReward = habit.xpReward || BASE_REWARDS.habitXP;
    const coinsReward = habit.essenceReward || BASE_REWARDS.habitEssence;

    let existing = false;
    let existingId: string | null = null;

    if (isUUID(habitId)) {
      const { data } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('completion_date', date)
        .maybeSingle();
      if (data) {
        existing = true;
        existingId = data.id;
      }
    } else {
      existing = !!todayRecords[date]?.completedHabitIds?.includes(habitId);
    }

    let completed = false;
    let xpDelta = 0;
    let coinsDelta = 0;

    if (existing) {
      // Uncomplete: Remove completion record and revoke XP & Coin transactions
      if (isUUID(habitId) && existingId) {
        await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingId);

        await supabase
          .from('xp_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'HABIT')
          .eq('source_id', habitId)
          .eq('transaction_date', date);

        await supabase
          .from('spidey_coin_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'HABIT')
          .eq('source_id', habitId);
      }

      completed = false;
      xpDelta = -xpReward;
      coinsDelta = -coinsReward;
    } else {
      // Complete: Insert completion record & award XP and Coins
      if (isUUID(habitId)) {
        await supabase.from('habit_completions').insert({
          user_id: userId,
          habit_id: habitId,
          completion_date: date,
          reward_granted: true,
        });

        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: xpReward,
          source_type: 'HABIT',
          source_id: habitId,
          transaction_date: date,
        });

        await supabase.from('spidey_coin_transactions').insert({
          user_id: userId,
          amount: coinsReward,
          transaction_type: 'EARNED',
          source_type: 'HABIT',
          source_id: habitId,
          description: `Protocol: ${habit.name}`,
        });
      }

      completed = true;
      xpDelta = xpReward;
      coinsDelta = coinsReward;
    }

    // Recalculate daily progress
    const isSuccessfulDay = await this.syncDailyProgress(userId, date, allMissions, allHabits);

    return { completed, xpDelta, coinsDelta, isSuccessfulDay };
  },

  /**
   * Recalculate daily progress record in cloud database
   */
  async syncDailyProgress(
    userId: string,
    date: string,
    missions: Mission[],
    habits: Habit[]
  ): Promise<boolean> {
    // 1. Fetch current completions for date
    const { data: missionComps } = await supabase
      .from('mission_completions')
      .select('mission_id')
      .eq('user_id', userId)
      .eq('completion_date', date);

    const { data: habitComps } = await supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('completion_date', date);

    const completedMissionIds = new Set((missionComps || []).map((m) => m.mission_id));
    const completedHabitIds = new Set((habitComps || []).map((h) => h.habit_id));

    const activeReqMissions = missions.filter((m) => m.isActive && m.isRequired);
    const activeHabits = habits.filter((h) => h.isActive);

    const reqMissionsCompletedCount = activeReqMissions.filter((m) => completedMissionIds.has(m.id)).length;
    const habitsCompletedCount = activeHabits.filter((h) => completedHabitIds.has(h.id)).length;

    const allReqMissionsDone = activeReqMissions.length > 0 && reqMissionsCompletedCount === activeReqMissions.length;
    const allHabitsDone = activeHabits.length > 0 && habitsCompletedCount === activeHabits.length;

    const isSuccessfulDay = allReqMissionsDone && allHabitsDone;

    const totalReq = activeReqMissions.length + activeHabits.length;
    const doneReq = reqMissionsCompletedCount + habitsCompletedCount;
    const percentage = totalReq > 0 ? Math.round((doneReq / totalReq) * 100) : 0;

    // Upsert daily progress
    await supabase.from('daily_progress').upsert({
      user_id: userId,
      date,
      required_missions_completed: reqMissionsCompletedCount,
      required_missions_total: activeReqMissions.length,
      habits_completed: habitsCompletedCount,
      habits_total: activeHabits.length,
      completion_percentage: percentage,
      is_successful_day: isSuccessfulDay,
      is_perfect_day: isSuccessfulDay,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, date' });

    // Sync Perfect Day rewards and rank progression
    if (isSuccessfulDay) {
      const { data: existingBonus } = await supabase
        .from('xp_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('source_type', 'PERFECT_DAY')
        .eq('transaction_date', date)
        .maybeSingle();

      if (!existingBonus) {
        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: BASE_REWARDS.perfectDayXP,
          source_type: 'PERFECT_DAY',
          transaction_date: date,
        });

        await supabase.from('spidey_coin_transactions').insert({
          user_id: userId,
          amount: BASE_REWARDS.perfectDayEssence,
          transaction_type: 'EARNED',
          source_type: 'PERFECT_DAY',
          description: 'Perfect Day: All Required Directives & Habits Complete',
        });
      }
    } else {
      // Day is not successful (or uncompleted): Revoke any Perfect Day rewards granted for today
      await supabase
        .from('xp_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('source_type', 'PERFECT_DAY')
        .eq('transaction_date', date);

      await supabase
        .from('spidey_coin_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('source_type', 'PERFECT_DAY');
    }

    // Sync rank progression based on total successful days count
    const { count } = await supabase
      .from('daily_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_successful_day', true);

    const totalSuccessfulDays = count || 0;
    const rankProg = getRankProgress(totalSuccessfulDays);

    await supabase.from('rank_progression').upsert({
      user_id: userId,
      current_rank: rankProg.currentRank,
      successful_days_for_current_rank: rankProg.successfulDaysForCurrentRank,
      required_successful_days: rankProg.requiredSuccessfulDaysForCurrentRank,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return isSuccessfulDay;
  },

  /**
   * Purchase Reward
   * Validates Spidey Coin balance >= cost before recording purchase and negative transaction.
   */
  async purchaseReward(userId: string, reward: Reward): Promise<{ success: boolean; error?: string }> {
    // 1. Calculate current real-time coin balance from transaction ledger
    const { data: txs } = await supabase
      .from('spidey_coin_transactions')
      .select('amount')
      .eq('user_id', userId);

    const balance = (txs || []).reduce((acc, t) => acc + t.amount, 0);

    if (balance < reward.essenceCost) {
      return { success: false, error: 'INSUFFICIENT_SPIDEY_COINS' };
    }

    // 2. Insert purchase record
    const { error: purErr } = await supabase.from('reward_purchases').insert({
      user_id: userId,
      reward_id: reward.id,
      cost: reward.essenceCost,
    });

    if (purErr) {
      return { success: false, error: purErr.message };
    }

    // 3. Insert negative Spidey Coin transaction
    await supabase.from('spidey_coin_transactions').insert({
      user_id: userId,
      amount: -reward.essenceCost,
      transaction_type: 'SPENT',
      source_type: 'PURCHASE',
      source_id: reward.id,
      description: `Unlocked: ${reward.name}`,
    });

    return { success: true };
  },

  /**
   * Reward CRUD
   */
  async createReward(userId: string, reward: Omit<Reward, 'id' | 'createdAt'>): Promise<Reward | null> {
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        user_id: userId,
        name: reward.name,
        description: reward.description || '',
        cost: reward.essenceCost,
        icon: reward.icon,
        active: reward.isActive,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      essenceCost: data.cost,
      icon: data.icon,
      isActive: data.active,
      createdAt: new Date(data.created_at).getTime(),
    };
  },

  async updateReward(userId: string, id: string, updates: Partial<Reward>): Promise<void> {
    if (!isUUID(id)) return;
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.essenceCost !== undefined) payload.cost = updates.essenceCost;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.isActive !== undefined) payload.active = updates.isActive;

    const { error } = await supabase.from('rewards').update(payload).eq('id', id).eq('user_id', userId);
    if (error) console.warn('updateReward error:', error);
  },

  async deleteReward(userId: string, id: string): Promise<void> {
    if (!isUUID(id)) return;
    try {
      await supabase.from('reward_purchases').delete().eq('reward_id', id).eq('user_id', userId);
    } catch (e) {
      console.warn('reward_purchases cleanup notice:', e);
    }
    const { error } = await supabase.from('rewards').delete().eq('id', id).eq('user_id', userId);
    if (error) console.warn('deleteReward error:', error);
  },

  /**
   * Mission CRUD
   */
  async createMission(userId: string, mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Mission | null> {
    const { data, error } = await supabase
      .from('missions')
      .insert({
        user_id: userId,
        title: mission.title,
        description: mission.description || '',
        priority: mission.priority,
        xp_reward: mission.xpReward,
        spidey_coin_reward: mission.essenceReward,
        required: mission.isRequired,
        active: mission.isActive,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      xpReward: data.xp_reward,
      essenceReward: data.spidey_coin_reward,
      isRequired: data.required,
      isActive: data.active,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
    };
  },

  async updateMission(userId: string, id: string, updates: Partial<Mission>): Promise<void> {
    if (!isUUID(id)) return;
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.xpReward !== undefined) payload.xp_reward = updates.xpReward;
    if (updates.essenceReward !== undefined) payload.spidey_coin_reward = updates.essenceReward;
    if (updates.isRequired !== undefined) payload.required = updates.isRequired;
    if (updates.isActive !== undefined) payload.active = updates.isActive;

    const { error } = await supabase.from('missions').update(payload).eq('id', id).eq('user_id', userId);
    if (error) console.warn('updateMission error:', error);
  },

  async deleteMission(userId: string, id: string): Promise<void> {
    if (!isUUID(id)) return;
    try {
      await supabase.from('mission_completions').delete().eq('mission_id', id).eq('user_id', userId);
    } catch (e) {
      console.warn('mission_completions cleanup notice:', e);
    }
    const { error } = await supabase.from('missions').delete().eq('id', id).eq('user_id', userId);
    if (error) console.warn('deleteMission error:', error);
  },

  /**
   * Habit CRUD
   */
  async createHabit(userId: string, habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>): Promise<Habit | null> {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name: habit.name,
        description: habit.description || '',
        frequency: 'DAILY',
        xp_reward: habit.xpReward,
        spidey_coin_reward: habit.essenceReward,
        active: habit.isActive,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      xpReward: data.xp_reward,
      essenceReward: data.spidey_coin_reward,
      isActive: data.active,
      currentStreak: 0,
      longestStreak: 0,
      createdAt: new Date(data.created_at).getTime(),
    };
  },

  async updateHabit(userId: string, id: string, updates: Partial<Habit>): Promise<void> {
    if (!isUUID(id)) return;
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.xpReward !== undefined) payload.xp_reward = updates.xpReward;
    if (updates.essenceReward !== undefined) payload.spidey_coin_reward = updates.essenceReward;
    if (updates.isActive !== undefined) payload.active = updates.isActive;

    const { error } = await supabase.from('habits').update(payload).eq('id', id).eq('user_id', userId);
    if (error) console.warn('updateHabit error:', error);
  },

  async deleteHabit(userId: string, id: string): Promise<void> {
    if (!isUUID(id)) return;
    try {
      await supabase.from('habit_completions').delete().eq('habit_id', id).eq('user_id', userId);
    } catch (e) {
      console.warn('habit_completions cleanup notice:', e);
    }
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
    if (error) console.warn('deleteHabit error:', error);
  },

  /**
   * Profile update
   */
  async updateProfile(userId: string, updates: { username?: string; sound_enabled?: boolean }): Promise<void> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.sound_enabled !== undefined) payload.sound_enabled = updates.sound_enabled;

    await supabase.from('profiles').update(payload).eq('user_id', userId);
  },

  /**
   * Notification actions
   */
  async markNotificationRead(userId: string, id: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
  },

  async clearNotifications(userId: string): Promise<void> {
    await supabase.from('notifications').delete().eq('user_id', userId);
  },

  /**
   * One-time Migration from localStorage to Supabase
   */
  async migrateLocalData(userId: string, localData: {
    missions?: Mission[];
    habits?: Habit[];
    dailyRecords?: Record<string, DailyRecord>;
    xpTransactions?: XPTransaction[];
    essenceTransactions?: EssenceTransaction[];
    rewards?: Reward[];
    purchases?: RewardPurchase[];
    profile?: Partial<UserProfile>;
  }): Promise<void> {
    // 1. Update Profile if custom username
    if (localData.profile?.username && localData.profile.username !== 'Operative' && localData.profile.username !== 'OPERATIVE') {
      await supabase.from('profiles').update({
        username: localData.profile.username,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);
    }

    // 2. Missions
    if (localData.missions && localData.missions.length > 0) {
      for (const m of localData.missions) {
        await supabase.from('missions').insert({
          user_id: userId,
          title: m.title,
          description: m.description || '',
          priority: m.priority,
          xp_reward: m.xpReward,
          spidey_coin_reward: m.essenceReward,
          required: m.isRequired,
          active: m.isActive,
        });
      }
    }

    // 3. Habits
    if (localData.habits && localData.habits.length > 0) {
      for (const h of localData.habits) {
        await supabase.from('habits').insert({
          user_id: userId,
          name: h.name,
          description: h.description || '',
          frequency: 'DAILY',
          xp_reward: h.xpReward,
          spidey_coin_reward: h.essenceReward,
          active: h.isActive,
        });
      }
    }

    // 4. Rewards
    if (localData.rewards && localData.rewards.length > 0) {
      for (const r of localData.rewards) {
        await supabase.from('rewards').insert({
          user_id: userId,
          name: r.name,
          description: r.description || '',
          cost: r.essenceCost,
          icon: r.icon,
          active: r.isActive,
        });
      }
    }

    // 5. XP Transactions
    if (localData.xpTransactions && localData.xpTransactions.length > 0) {
      const xpBatch = localData.xpTransactions.map((tx) => ({
        user_id: userId,
        amount: tx.amount,
        source_type: tx.source,
        source_id: tx.sourceId || null,
        transaction_date: tx.date || new Date().toISOString().split('T')[0],
      }));
      await supabase.from('xp_transactions').insert(xpBatch);
    }

    // 6. Coin Transactions
    if (localData.essenceTransactions && localData.essenceTransactions.length > 0) {
      const coinBatch = localData.essenceTransactions.map((tx) => ({
        user_id: userId,
        amount: tx.amount,
        transaction_type: tx.amount < 0 ? 'SPENT' : 'EARNED',
        source_type: tx.source,
        source_id: tx.sourceId || null,
        description: tx.description || 'Legacy Imported Transaction',
      }));
      await supabase.from('spidey_coin_transactions').insert(coinBatch);
    }

    // 7. Daily Records
    if (localData.dailyRecords) {
      const records = Object.values(localData.dailyRecords);
      for (const r of records) {
        await supabase.from('daily_progress').upsert({
          user_id: userId,
          date: r.date,
          required_missions_completed: r.completedMissionIds?.length || 0,
          required_missions_total: r.totalRequiredMissions || 0,
          habits_completed: r.completedHabitIds?.length || 0,
          habits_total: r.totalActiveHabits || 0,
          completion_percentage: r.isSuccessfulDay ? 100 : 50,
          is_successful_day: r.isSuccessfulDay,
          is_perfect_day: r.isPerfectDay,
          xp_earned: r.xpEarned || 0,
          spidey_coins_earned: r.essenceEarned || 0,
        }, { onConflict: 'user_id, date' });
      }

      // Sync Rank Progression from successful days
      const totalSuccessfulDays = records.filter((r) => r.isSuccessfulDay).length;
      const rankProg = getRankProgress(totalSuccessfulDays);
      await supabase.from('rank_progression').upsert({
        user_id: userId,
        current_rank: rankProg.currentRank,
        successful_days_for_current_rank: rankProg.successfulDaysForCurrentRank,
        required_successful_days: rankProg.requiredSuccessfulDaysForCurrentRank,
      }, { onConflict: 'user_id' });
    }

    // Notification of migration complete
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'LOCAL DATA IMPORTED',
      message: 'Local browser progress was successfully synchronized into your permanent Supabase cloud account.',
      type: 'SYSTEM',
    });
  },
};
