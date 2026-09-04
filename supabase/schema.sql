-- ============================================================================
-- WEB ASCEND // SUPABASE POSTGRESQL SCHEMA & SECURITY RULES
-- ============================================================================
-- Complete schema for WEB ASCEND Superhero Command Center
-- Tables, Constraints, Row Level Security (RLS), Triggers, & Server-Side Functions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL DEFAULT 'OPERATIVE',
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    avatar_icon TEXT DEFAULT 'SpiderIcon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. MISSIONS (Daily Tasks & Directives)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    xp_reward INTEGER NOT NULL DEFAULT 50 CHECK (xp_reward >= 0),
    spidey_coin_reward INTEGER NOT NULL DEFAULT 20 CHECK (spidey_coin_reward >= 0),
    required BOOLEAN NOT NULL DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own missions"
    ON public.missions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_missions_user_active ON public.missions(user_id, active);

-- ============================================================================
-- 3. MISSION COMPLETIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mission_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    completion_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reward_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_mission_completion UNIQUE(user_id, mission_id, completion_date)
);

ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own mission completions"
    ON public.mission_completions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mission_completions_user_date ON public.mission_completions(user_id, completion_date);

-- ============================================================================
-- 4. HABITS (Daily Protocols)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL DEFAULT 'DAILY',
    xp_reward INTEGER NOT NULL DEFAULT 35 CHECK (xp_reward >= 0),
    spidey_coin_reward INTEGER NOT NULL DEFAULT 15 CHECK (spidey_coin_reward >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
    ON public.habits FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habits_user_active ON public.habits(user_id, active);

-- ============================================================================
-- 5. HABIT COMPLETIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    completion_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reward_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_habit_completion UNIQUE(user_id, habit_id, completion_date)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habit completions"
    ON public.habit_completions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON public.habit_completions(user_id, completion_date);

-- ============================================================================
-- 6. XP TRANSACTIONS (Experience Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    source_type TEXT NOT NULL, -- 'MISSION', 'HABIT', 'PERFECT_DAY', 'LEVEL_BONUS', 'MANUAL'
    source_id TEXT DEFAULT NULL,
    transaction_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP transactions"
    ON public.xp_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert XP transactions"
    ON public.xp_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_xp_tx_user_source ON public.xp_transactions(user_id, source_type, source_id, transaction_date);

-- ============================================================================
-- 7. SPIDEY COIN TRANSACTIONS (Currency Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.spidey_coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- Positive = earned, Negative = spent
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EARNED', 'SPENT')),
    source_type TEXT NOT NULL, -- 'MISSION', 'HABIT', 'PERFECT_DAY', 'LEVEL_UP', 'RANK_UP', 'PURCHASE'
    source_id TEXT DEFAULT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.spidey_coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Spidey Coin transactions"
    ON public.spidey_coin_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert Spidey Coin transactions"
    ON public.spidey_coin_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user_created ON public.spidey_coin_transactions(user_id, created_at);

-- ============================================================================
-- 8. LEVEL PROGRESSION (XP controls Hero Level)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.level_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.level_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their level progression"
    ON public.level_progression FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. RANK PROGRESSION (180 Successful Days per Tier)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rank_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_rank TEXT NOT NULL DEFAULT 'E',
    successful_days_for_current_rank INTEGER NOT NULL DEFAULT 0 CHECK (successful_days_for_current_rank >= 0),
    required_successful_days INTEGER NOT NULL DEFAULT 180 CHECK (required_successful_days > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rank_progression ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their rank progression"
    ON public.rank_progression FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. REWARDS (Web Market)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cost INTEGER NOT NULL CHECK (cost > 0),
    icon TEXT NOT NULL DEFAULT 'Sparkles',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rewards"
    ON public.rewards FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 11. REWARD PURCHASES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reward_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    cost INTEGER NOT NULL CHECK (cost > 0),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their reward purchases"
    ON public.reward_purchases FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 12. DAILY PROGRESS (Temporal Consistency Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    required_missions_completed INTEGER NOT NULL DEFAULT 0,
    required_missions_total INTEGER NOT NULL DEFAULT 0,
    habits_completed INTEGER NOT NULL DEFAULT 0,
    habits_total INTEGER NOT NULL DEFAULT 0,
    completion_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_successful_day BOOLEAN NOT NULL DEFAULT false,
    is_perfect_day BOOLEAN NOT NULL DEFAULT false,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    spidey_coins_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_daily_progress UNIQUE(user_id, date)
);

ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their daily progress"
    ON public.daily_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON public.daily_progress(user_id, date);

-- ============================================================================
-- 13. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 14. STORED PROCEDURES & SAFE OPERATIONS
-- ============================================================================

-- Function: Calculate user current Spidey Coin Balance from ledger
CREATE OR REPLACE FUNCTION public.get_spidey_coin_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM public.spidey_coin_transactions
    WHERE user_id = p_user_id;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Safe Reward Purchase (Atomically checks balance >= cost)
CREATE OR REPLACE FUNCTION public.purchase_reward_safe(p_reward_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_cost INTEGER;
    v_name TEXT;
    v_current_balance INTEGER;
    v_purchase_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
    END IF;

    -- Fetch reward info
    SELECT cost, name INTO v_cost, v_name
    FROM public.rewards
    WHERE id = p_reward_id AND user_id = v_user_id AND active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'REWARD_NOT_FOUND');
    END IF;

    -- Check balance
    v_current_balance := public.get_spidey_coin_balance(v_user_id);
    IF v_current_balance < v_cost THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'INSUFFICIENT_FUNDS',
            'required', v_cost,
            'balance', v_current_balance
        );
    END IF;

    -- Insert purchase record
    INSERT INTO public.reward_purchases(user_id, reward_id, cost)
    VALUES (v_user_id, p_reward_id, v_cost)
    RETURNING id INTO v_purchase_id;

    -- Insert negative coin transaction
    INSERT INTO public.spidey_coin_transactions(
        user_id, amount, transaction_type, source_type, source_id, description
    ) VALUES (
        v_user_id, -v_cost, 'SPENT', 'PURCHASE', p_reward_id::text, 'Unlocked: ' || v_name
    );

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'cost', v_cost,
        'remaining_balance', v_current_balance - v_cost
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Initialize new user default data
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := NEW.id;
    v_username TEXT;
BEGIN
    v_username := COALESCE(NEW.raw_user_meta_data->>'username', 'OPERATIVE');

    -- 1. Create Profile
    INSERT INTO public.profiles (user_id, username)
    VALUES (v_user_id, v_username)
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Create Level Progression (Level 1)
    INSERT INTO public.level_progression (user_id, current_level)
    VALUES (v_user_id, 1)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Create Rank Progression (Rank E, 0 / 180)
    INSERT INTO public.rank_progression (user_id, current_rank, successful_days_for_current_rank, required_successful_days)
    VALUES (v_user_id, 'E', 0, 180)
    ON CONFLICT (user_id) DO NOTHING;

    -- 4. Create Starter Missions
    INSERT INTO public.missions (user_id, title, description, priority, xp_reward, spidey_coin_reward, required, active)
    VALUES 
        (v_user_id, 'Hydration Protocol', 'Drink 3L of water throughout the day for cellular vitality.', 'HIGH', 40, 20, true, true),
        (v_user_id, 'Acrobatic / Strength Conditioning', 'Execute 45 min workout or functional kinetic movement.', 'HIGH', 80, 35, true, true),
        (v_user_id, 'Cognitive Focus Deep Work', 'Complete 90 uninterrupted minutes on paramount career objective.', 'HIGH', 100, 40, true, true),
        (v_user_id, 'Sector Patrol Recon', '30-minute evening walk or mobility session to decompress neural load.', 'MEDIUM', 30, 15, false, true);

    -- 5. Create Starter Habits
    INSERT INTO public.habits (user_id, name, description, frequency, xp_reward, spidey_coin_reward, active)
    VALUES
        (v_user_id, 'Zero Refined Sugar Intake', 'Clean fuel only. Eliminate sodas, sweets, and ultra-processed junk.', 'DAILY', 35, 15, true),
        (v_user_id, '10-Minute Evening Gear Reset', 'Clear workspace desk, review tomorrow directives, prep equipment.', 'DAILY', 25, 10, true),
        (v_user_id, 'Sleep Protocol (7.5+ Hours)', 'Target 8 hours deep sleep for cellular and kinetic regeneration.', 'DAILY', 40, 20, true);

    -- 6. Create Starter Rewards
    INSERT INTO public.rewards (user_id, name, description, cost, icon, active)
    VALUES
        (v_user_id, 'Cheat Meal Pass', 'High-calorie sensory recharge of choice.', 250, 'Utensils', true),
        (v_user_id, 'Gaming / Sci-Fi Marathon', '2 hours uninterrupted leisure immersion without guilt.', 200, 'Gamepad', true),
        (v_user_id, 'Tactical Gear Upgrade', 'Purchase desired tech/physical accessory for HQ.', 600, 'Shield', true),
        (v_user_id, 'Full Rest Day Protocol', 'Guilt-free complete downtime weekend afternoon.', 400, 'Coffee', true);

    -- 7. Welcome Notification
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        v_user_id, 
        'SYSTEM ONLINE', 
        'Neural link synchronized. Welcome, ' || v_username || '. Initialized at Rank E. Complete all required missions and daily habits to ascend.', 
        'SYSTEM'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: automatically fire setup on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- ============================================================================
-- 14. API PERMISSIONS & POSTGREST SCHEMA CACHE RELOAD
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Force PostgREST to instantly refresh its in-memory schema cache
NOTIFY pgrst, 'reload schema';

