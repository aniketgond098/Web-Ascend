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

    // 7. Starter Spidey Coins Allowance (50 coins)
    const { data: existingCoins } = await supabase
      .from('spidey_coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!existingCoins || existingCoins.length === 0) {
      await supabase.from('spidey_coin_transactions').insert({
        user_id: userId,
        amount: 50,
        transaction_type: 'EARNED',
        source_type: 'INITIAL',
        description: 'Starter Operative Allowance',
      });
    }

    // 8. Initial Notification
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'SYSTEM INITIALIZED',
      message: `Welcome to WEB ASCEND, ${username}. Initialized at Rank E with 50 Spidey Coins. Complete all required daily directives and protocols to ascend.`,
      type: 'SYSTEM',
    });
  },

  /**
   * Fetch all user data from cloud database in parallel (batches independent queries)
   */
  async fetchAllUserData(userId: string, todayDate: string): Promise<CloudDataPayload> {
    // 1. Fetch all independent tables concurrently in a single network round-trip batch
    const [
      profileResult,
      levelResult,
      rankResult,
      missionsResult,
      habitsResult,
      dailyProgressResult,
      missionCompletionsResult,
      habitCompletionsResult,
      xpTxResult,
      coinTxResult,
      rewardsResult,
      purchasesResult,
      notifResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('level_progression').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('rank_progression').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('missions').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('daily_progress').select('*').eq('user_id', userId),
      supabase.from('mission_completions').select('*').eq('user_id', userId),
      supabase.from('habit_completions').select('*').eq('user_id', userId),
      supabase.from('xp_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('spidey_coin_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('rewards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('reward_purchases').select('*, rewards(name)').eq('user_id', userId).order('purchased_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);

    let profileRow = profileResult.data;

    // Check auth metadata for fallback username
    let authUsername = '';
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      authUsername = sessionData?.session?.user?.user_metadata?.username || '';
    } catch {}

    if (!profileRow) {
      try {
        const initialName = authUsername || 'OPERATIVE';
        await this.initializeNewUser(userId, initialName);
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

    const levelRow = levelResult.data;
    const rankRow = rankResult.data;
    let missionsRows = missionsResult.data || [];
    let habitsRows = habitsResult.data || [];
    const dailyProgressRows = dailyProgressResult.data;
    const missionCompletionsRows = missionCompletionsResult.data;
    const habitCompletionsRows = habitCompletionsResult.data;
    const xpTxRows = xpTxResult.data;
    const coinTxRows = coinTxResult.data;
    let rewardsRows = rewardsResult.data || [];

    const purchasesRows = purchasesResult.data;
    const notifRows = notifResult.data;

    // If cloud missions are empty, seed starter missions to database
    if (missionsRows.length === 0) {
      try {
        const missionsToInsert = STARTER_MISSIONS.map((m) => ({
          user_id: userId,
          title: m.title,
          description: m.description,
          priority: m.priority,
          xp_reward: m.xpReward,
          spidey_coin_reward: m.essenceReward,
          required: m.isRequired,
          active: m.isActive,
        }));
        const { data: insertedMissions } = await supabase
          .from('missions')
          .insert(missionsToInsert)
          .select('*');
        if (insertedMissions && insertedMissions.length > 0) {
          missionsRows = insertedMissions;
        }
      } catch (err) {
        console.warn('Auto-seed missions notice:', err);
      }
    }

    // If cloud habits are empty, seed starter habits to database
    if (habitsRows.length === 0) {
      try {
        const habitsToInsert = STARTER_HABITS.map((h) => ({
          user_id: userId,
          name: h.name,
          description: h.description,
          frequency: 'DAILY',
          xp_reward: h.xpReward,
          spidey_coin_reward: h.essenceReward,
          active: h.isActive,
        }));
        const { data: insertedHabits } = await supabase
          .from('habits')
          .insert(habitsToInsert)
          .select('*');
        if (insertedHabits && insertedHabits.length > 0) {
          habitsRows = insertedHabits;
        }
      } catch (err) {
        console.warn('Auto-seed habits notice:', err);
      }
    }

    // Transform Missions (missions are single-day tasks)
    const missions: Mission[] = missionsRows.map((m) => {
      const createdAtDate = m.created_at ? new Date(m.created_at) : new Date();
      const derivedDate = m.target_date || (!isNaN(createdAtDate.getTime()) ? createdAtDate.toISOString().split('T')[0] : todayDate);
      return {
        id: m.id,
        title: m.title,
        description: m.description || '',
        priority: m.priority,
        xpReward: m.xp_reward,
        essenceReward: m.spidey_coin_reward,
        isRequired: m.required,
        isActive: m.active,
        createdAt: createdAtDate.getTime(),
        updatedAt: new Date(m.updated_at).getTime(),
        date: derivedDate,
      };
    });

    // Map habit completion dates for streak calculation
    const habitDatesMap: Record<string, Set<string>> = {};
    (habitCompletionsRows || []).forEach((hc) => {
      if (!habitDatesMap[hc.habit_id]) {
        habitDatesMap[hc.habit_id] = new Set();
      }
      habitDatesMap[hc.habit_id].add(hc.completion_date);
    });

    // Helper to calculate streak from distinct dates
    const calculateHabitStreak = (datesSet: Set<string> | undefined, referenceDateStr: string): { currentStreak: number; longestStreak: number } => {
      if (!datesSet || datesSet.size === 0) return { currentStreak: 0, longestStreak: 0 };
      const sortedDates = Array.from(datesSet).sort().reverse();
      
      let currentStreak = 0;
      let checkDate = new Date(`${referenceDateStr}T12:00:00Z`);
      const todayStr = checkDate.toISOString().split('T')[0];
      
      // If completed today, count today; if not, count from yesterday
      if (!datesSet.has(todayStr)) {
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }

      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (datesSet.has(dStr)) {
          currentStreak++;
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break;
        }
      }

      return {
        currentStreak,
        longestStreak: Math.max(currentStreak, datesSet.size),
      };
    };

    // Transform Habits
    const habits: Habit[] = habitsRows.map((h) => {
      const streakInfo = calculateHabitStreak(habitDatesMap[h.id], todayDate);
      return {
        id: h.id,
        name: h.name,
        description: h.description || '',
        xpReward: h.xp_reward,
        essenceReward: h.spidey_coin_reward,
        isActive: h.active,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        createdAt: new Date(h.created_at).getTime(),
      };
    });

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
    let resolvedUsername = profileRow?.username || authUsername || 'OPERATIVE';
    if ((!resolvedUsername || resolvedUsername === 'OPERATIVE' || resolvedUsername === 'Operative') && authUsername && authUsername !== 'OPERATIVE' && authUsername !== 'Operative') {
      resolvedUsername = authUsername;
    }

    const profile: UserProfile = {
      username: resolvedUsername,
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
   * Prevents duplicate rewards when toggled repeatedly and revokes cleanly on uncheck.
   */
  async toggleMission(
    userId: string,
    missionId: string,
    date: string,
    mission: Mission,
    allMissions: Mission[],
    allHabits: Habit[],
    todayRecords: Record<string, DailyRecord>,
    targetCompleted?: boolean
  ): Promise<{
    completed: boolean;
    xpDelta: number;
    coinsDelta: number;
    isSuccessfulDay: boolean;
  }> {
    const xpReward = mission.xpReward || BASE_REWARDS.missionXP;
    const coinsReward = mission.essenceReward || BASE_REWARDS.missionEssence;

    // Ensure missionId is a valid UUID in Supabase
    let resolvedMissionId = missionId;
    if (!isUUID(resolvedMissionId)) {
      try {
        const { data: existingM } = await supabase
          .from('missions')
          .select('id')
          .eq('user_id', userId)
          .eq('title', mission.title)
          .maybeSingle();

        if (existingM) {
          resolvedMissionId = existingM.id;
        } else {
          const { data: createdM } = await supabase
            .from('missions')
            .insert({
              user_id: userId,
              title: mission.title,
              description: mission.description || '',
              priority: mission.priority,
              xp_reward: xpReward,
              spidey_coin_reward: coinsReward,
              required: mission.isRequired,
              active: mission.isActive,
            })
            .select('id')
            .single();
          if (createdM) {
            resolvedMissionId = createdM.id;
          }
        }
      } catch (e) {
        console.warn('Error resolving mission UUID:', e);
      }
    }

    let existing = false;
    let existingId: string | null = null;

    if (isUUID(resolvedMissionId)) {
      const { data } = await supabase
        .from('mission_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('mission_id', resolvedMissionId)
        .eq('completion_date', date)
        .maybeSingle();
      if (data) {
        existing = true;
        existingId = data.id;
      }
    } else {
      existing = !!todayRecords[date]?.completedMissionIds?.includes(missionId);
    }

    const shouldComplete = targetCompleted !== undefined ? targetCompleted : !existing;
    let completed = false;
    let xpDelta = 0;
    let coinsDelta = 0;

    if (!shouldComplete) {
      // Uncomplete: Remove completion record and revoke XP & Coin transactions
      if (isUUID(resolvedMissionId)) {
        await supabase
          .from('mission_completions')
          .delete()
          .eq('user_id', userId)
          .eq('mission_id', resolvedMissionId)
          .eq('completion_date', date);

        await supabase
          .from('xp_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'MISSION')
          .eq('source_id', resolvedMissionId)
          .eq('transaction_date', date);

        const { error: coinDelErr, count: coinDelCount } = await supabase
          .from('spidey_coin_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'MISSION')
          .eq('source_id', resolvedMissionId)
          .gte('created_at', `${date}T00:00:00Z`)
          .lte('created_at', `${date}T23:59:59.999Z`);

        // If delete was blocked by RLS or 0 rows deleted, insert compensating negative transaction
        if (coinDelErr || (coinDelCount !== null && coinDelCount === 0)) {
          await supabase.from('spidey_coin_transactions').insert({
            user_id: userId,
            amount: -coinsReward,
            transaction_type: 'SPENT',
            source_type: 'MISSION',
            source_id: resolvedMissionId,
            description: `Revoked: ${mission.title}`,
          });
        }
      }

      completed = false;
      xpDelta = -xpReward;
      coinsDelta = -coinsReward;
    } else {
      // Complete: Upsert completion record & award XP and Coins
      if (isUUID(resolvedMissionId)) {
        await supabase.from('mission_completions').upsert({
          user_id: userId,
          mission_id: resolvedMissionId,
          completion_date: date,
          reward_granted: true,
        }, { onConflict: 'user_id, mission_id, completion_date' });

        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: xpReward,
          source_type: 'MISSION',
          source_id: resolvedMissionId,
          transaction_date: date,
        });

        await supabase.from('spidey_coin_transactions').insert({
          user_id: userId,
          amount: coinsReward,
          transaction_type: 'EARNED',
          source_type: 'MISSION',
          source_id: resolvedMissionId,
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
    todayRecords: Record<string, DailyRecord>,
    targetCompleted?: boolean
  ): Promise<{
    completed: boolean;
    xpDelta: number;
    coinsDelta: number;
    isSuccessfulDay: boolean;
  }> {
    const xpReward = habit.xpReward || BASE_REWARDS.habitXP;
    const coinsReward = habit.essenceReward || BASE_REWARDS.habitEssence;

    // Ensure habitId is a valid UUID in Supabase
    let resolvedHabitId = habitId;
    if (!isUUID(resolvedHabitId)) {
      try {
        const { data: existingH } = await supabase
          .from('habits')
          .select('id')
          .eq('user_id', userId)
          .eq('name', habit.name)
          .maybeSingle();

        if (existingH) {
          resolvedHabitId = existingH.id;
        } else {
          const { data: createdH } = await supabase
            .from('habits')
            .insert({
              user_id: userId,
              name: habit.name,
              description: habit.description || '',
              frequency: 'DAILY',
              xp_reward: xpReward,
              spidey_coin_reward: coinsReward,
              active: habit.isActive,
            })
            .select('id')
            .single();
          if (createdH) {
            resolvedHabitId = createdH.id;
          }
        }
      } catch (e) {
        console.warn('Error resolving habit UUID:', e);
      }
    }

    let existing = false;
    let existingId: string | null = null;

    if (isUUID(resolvedHabitId)) {
      const { data } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', resolvedHabitId)
        .eq('completion_date', date)
        .maybeSingle();
      if (data) {
        existing = true;
        existingId = data.id;
      }
    } else {
      existing = !!todayRecords[date]?.completedHabitIds?.includes(habitId);
    }

    const shouldComplete = targetCompleted !== undefined ? targetCompleted : !existing;
    let completed = false;
    let xpDelta = 0;
    let coinsDelta = 0;

    if (!shouldComplete) {
      // Uncomplete: Remove completion record and revoke XP & Coin transactions
      if (isUUID(resolvedHabitId)) {
        await supabase
          .from('habit_completions')
          .delete()
          .eq('user_id', userId)
          .eq('habit_id', resolvedHabitId)
          .eq('completion_date', date);

        await supabase
          .from('xp_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'HABIT')
          .eq('source_id', resolvedHabitId)
          .eq('transaction_date', date);

        const { error: coinDelErr, count: coinDelCount } = await supabase
          .from('spidey_coin_transactions')
          .delete()
          .eq('user_id', userId)
          .eq('source_type', 'HABIT')
          .eq('source_id', resolvedHabitId)
          .gte('created_at', `${date}T00:00:00Z`)
          .lte('created_at', `${date}T23:59:59.999Z`);

        // If delete was blocked by RLS or 0 rows deleted, insert compensating negative transaction
        if (coinDelErr || (coinDelCount !== null && coinDelCount === 0)) {
          await supabase.from('spidey_coin_transactions').insert({
            user_id: userId,
            amount: -coinsReward,
            transaction_type: 'SPENT',
            source_type: 'HABIT',
            source_id: resolvedHabitId,
            description: `Revoked Protocol: ${habit.name}`,
          });
        }
      }

      completed = false;
      xpDelta = -xpReward;
      coinsDelta = -coinsReward;
    } else {
      // Complete: Upsert completion record & award XP and Coins
      if (isUUID(resolvedHabitId)) {
        await supabase.from('habit_completions').upsert({
          user_id: userId,
          habit_id: resolvedHabitId,
          completion_date: date,
          reward_granted: true,
        }, { onConflict: 'user_id, habit_id, completion_date' });

        await supabase.from('xp_transactions').insert({
          user_id: userId,
          amount: xpReward,
          source_type: 'HABIT',
          source_id: resolvedHabitId,
          transaction_date: date,
        });

        await supabase.from('spidey_coin_transactions').insert({
          user_id: userId,
          amount: coinsReward,
          transaction_type: 'EARNED',
          source_type: 'HABIT',
          source_id: resolvedHabitId,
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

    // Scope active required missions strictly to the evaluated date (missions are one-day tasks)
    const activeReqMissions = missions.filter((m) => {
      if (!m.isActive || !m.isRequired) return false;
      const mDate = m.date || (m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : date);
      return mDate === date;
    });
    const activeHabits = habits.filter((h) => h.isActive);

    const reqMissionsCompletedCount = activeReqMissions.filter((m) => completedMissionIds.has(m.id)).length;
    const habitsCompletedCount = activeHabits.filter((h) => completedHabitIds.has(h.id)).length;

    const allReqMissionsDone = activeReqMissions.length === 0 || reqMissionsCompletedCount === activeReqMissions.length;
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

      const { error: delCoinBonusErr, count: bonusCount } = await supabase
        .from('spidey_coin_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('source_type', 'PERFECT_DAY')
        .gte('created_at', `${date}T00:00:00Z`)
        .lte('created_at', `${date}T23:59:59.999Z`);

      // If delete failed or did not remove rows, check if an EARNED bonus exists for today and insert compensating SPENT row
      if (delCoinBonusErr || (bonusCount !== null && bonusCount === 0)) {
        const { data: hasBonus } = await supabase
          .from('spidey_coin_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('source_type', 'PERFECT_DAY')
          .eq('transaction_type', 'EARNED')
          .gte('created_at', `${date}T00:00:00Z`)
          .lte('created_at', `${date}T23:59:59.999Z`)
          .maybeSingle();

        if (hasBonus) {
          await supabase.from('spidey_coin_transactions').insert({
            user_id: userId,
            amount: -BASE_REWARDS.perfectDayEssence,
            transaction_type: 'SPENT',
            source_type: 'PERFECT_DAY',
            description: 'Revoked: Perfect Day Bonus',
          });
        }
      }
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

  async deleteReward(userId: string, id: string, name?: string): Promise<void> {
    try {
      if (isUUID(id)) {
        await supabase.from('reward_purchases').delete().eq('reward_id', id).eq('user_id', userId);
        const { error } = await supabase.from('rewards').delete().eq('id', id).eq('user_id', userId);
        if (error) console.warn('deleteReward error:', error);
      } else if (name) {
        // Fallback: match and delete by user_id and name if id is a local/legacy non-UUID
        const { data: matched } = await supabase
          .from('rewards')
          .select('id')
          .eq('user_id', userId)
          .ilike('name', name);
        if (matched && matched.length > 0) {
          for (const m of matched) {
            await supabase.from('reward_purchases').delete().eq('reward_id', m.id).eq('user_id', userId);
            await supabase.from('rewards').delete().eq('id', m.id).eq('user_id', userId);
          }
        }
      }
    } catch (e) {
      console.warn('deleteReward execution error:', e);
    }
  },

  /**
   * Mission CRUD
   */
  async createMission(userId: string, mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'> & { date?: string }): Promise<Mission | null> {
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

    const createdAtDate = data.created_at ? new Date(data.created_at) : new Date();
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      xpReward: data.xp_reward,
      essenceReward: data.spidey_coin_reward,
      isRequired: data.required,
      isActive: data.active,
      createdAt: createdAtDate.getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      date: data.target_date || mission.date || (!isNaN(createdAtDate.getTime()) ? createdAtDate.toISOString().split('T')[0] : undefined),
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
    if (updates.username !== undefined) payload.username = updates.username.trim();
    if (updates.sound_enabled !== undefined) payload.sound_enabled = updates.sound_enabled;

    await supabase.from('profiles').upsert({
      user_id: userId,
      ...payload,
    }, { onConflict: 'user_id' });

    if (updates.username && updates.username.trim()) {
      try {
        await supabase.auth.updateUser({
          data: { username: updates.username.trim() },
        });
      } catch (e) {
        console.warn('Auth user metadata update notice:', e);
      }
    }
  },

  /**
   * Factory Reset / Re-initialization for user data in Supabase cloud database
   */
  async reinitializeUser(userId: string, username: string = 'OPERATIVE'): Promise<void> {
    const cleanUsername = username.trim() || 'OPERATIVE';

    // 1. Delete all completion records
    try {
      await supabase.from('mission_completions').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe mission_completions notice:', e);
    }

    try {
      await supabase.from('habit_completions').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe habit_completions notice:', e);
    }

    // 2. Delete all ledger transactions and purchases
    try {
      await supabase.from('xp_transactions').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe xp_transactions notice:', e);
    }

    try {
      await supabase.from('spidey_coin_transactions').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe spidey_coin_transactions notice:', e);
    }

    try {
      await supabase.from('reward_purchases').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe reward_purchases notice:', e);
    }

    try {
      await supabase.from('daily_progress').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe daily_progress notice:', e);
    }

    try {
      await supabase.from('notifications').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe notifications notice:', e);
    }

    // 3. Clear user-created custom missions, habits, rewards
    try {
      await supabase.from('missions').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe missions notice:', e);
    }

    try {
      await supabase.from('habits').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe habits notice:', e);
    }

    try {
      await supabase.from('rewards').delete().eq('user_id', userId);
    } catch (e) {
      console.warn('Wipe rewards notice:', e);
    }

    // 4. Re-seed clean starter entities and progression
    await this.initializeNewUser(userId, cleanUsername);
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

  /**
   * Calibrate / Reset Spidey Coins to target value (e.g. 50)
   */
  async calibrateSpideyCoins(userId: string, targetCoins: number = 50): Promise<number> {
    const { data: coinTxs } = await supabase
      .from('spidey_coin_transactions')
      .select('amount')
      .eq('user_id', userId);

    const currentBalance = (coinTxs || []).reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const delta = targetCoins - currentBalance;

    if (delta !== 0) {
      await supabase.from('spidey_coin_transactions').insert({
        user_id: userId,
        amount: delta,
        transaction_type: delta > 0 ? 'EARNED' : 'SPENT',
        source_type: delta > 0 ? 'INITIAL' : 'PURCHASE',
        description: `Balance Calibration: Reset to ${targetCoins} Spidey Coins`,
      });
    }

    return targetCoins;
  },
};
