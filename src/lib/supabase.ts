import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Safely parse a JWT payload in the browser without external libraries
 */
export const decodeJwtPayload = (token: string): any => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

/**
 * Detect if an API key is a Supabase "service_role" (secret) key.
 * Supabase strictly forbids secret keys in client-side browser applications,
 * returning: "Auth error: Forbidden use of secret API key in browser"
 */
export const isSecretApiKey = (key: string): boolean => {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();

  // 1. Supabase modern secret key prefixes
  if (
    trimmed.startsWith('sb_secret_') ||
    trimmed.startsWith('sbs_') ||
    trimmed.startsWith('secret_')
  ) {
    return true;
  }

  // 2. Decode JWT payload and inspect role
  const payload = decodeJwtPayload(trimmed);
  if (payload) {
    const role = payload.role;
    if (role === 'service_role' || role === 'postgres' || role === 'supabase_admin') {
      return true;
    }
  }

  // 3. Fallback raw string inspection
  if (trimmed.toLowerCase().includes('service_role')) {
    return true;
  }

  return false;
};

/**
 * Inspects a key and returns its identified Supabase role
 */
export const getApiKeyRole = (key: string): 'anon' | 'service_role' | 'unknown' | 'empty' => {
  if (!key || typeof key !== 'string' || !key.trim()) return 'empty';
  const trimmed = key.trim();
  if (isSecretApiKey(trimmed)) return 'service_role';
  const payload = decodeJwtPayload(trimmed);
  if (payload && payload.role === 'anon') return 'anon';
  if (trimmed.startsWith('sb_publishable_') || trimmed.startsWith('sbp_')) return 'anon';
  return 'unknown';
};

// Auto-purge any forbidden secret keys from localStorage to instantly recover the app
let secretKeyWasPurged = false;
let secretKeyInEnvDetected = Boolean(envAnonKey && isSecretApiKey(envAnonKey));

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('web_ascend_sb_key');
    if (stored && isSecretApiKey(stored)) {
      console.warn('[WEB ASCEND] Forbidden secret API key detected in browser storage. Auto-purged to protect app security.');
      localStorage.removeItem('web_ascend_sb_key');
      secretKeyWasPurged = true;
    }
  } catch {
    // ignore storage access errors
  }
}

// Determine active credentials dynamically
export const getActiveSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('web_ascend_sb_url');
    if (stored && stored.trim().startsWith('https://')) return stored.trim();
  }
  if (envUrl && !envUrl.includes('your-project-id') && envUrl.startsWith('https://')) {
    return envUrl.trim();
  }
  return '';
};

export const getActiveSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('web_ascend_sb_key');
    if (stored && !isSecretApiKey(stored)) return stored.trim();
  }
  if (envAnonKey && !envAnonKey.includes('your-anon-public-key') && !isSecretApiKey(envAnonKey)) {
    return envAnonKey.trim();
  }
  return '';
};

// Exported variables kept synchronized with active credentials
export let SUPABASE_URL = getActiveSupabaseUrl();
export let SUPABASE_ANON_KEY = getActiveSupabaseAnonKey();

export const refreshSupabaseConfig = () => {
  SUPABASE_URL = getActiveSupabaseUrl();
  SUPABASE_ANON_KEY = getActiveSupabaseAnonKey();
};

/**
 * Returns true if a secret key was detected either in environment variables or storage
 */
export const hasSecretKeyConfigured = (): boolean => {
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('web_ascend_sb_key');
    if (storedKey && storedKey.trim()) {
      return isSecretApiKey(storedKey);
    }
  }

  // If no local override is configured, check environment variable
  if (envAnonKey && !envAnonKey.includes('your-anon-public-key')) {
    return isSecretApiKey(envAnonKey);
  }

  return false;
};

/**
 * Check if Supabase has valid, safe client-side credentials
 */
export const isSupabaseConfigured = (): boolean => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseAnonKey();
  return (
    Boolean(url) &&
    Boolean(key) &&
    !url.includes('your-project-id') &&
    url.startsWith('https://') &&
    !isSecretApiKey(key)
  );
};

// Safe placeholder anon token that will never trigger secret key errors
const DUMMY_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';

// Supabase client instance with cache validation
let cachedUrl = '';
let cachedKey = '';
let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  const activeUrl = getActiveSupabaseUrl();
  const activeKey = getActiveSupabaseAnonKey();

  if (clientInstance && cachedUrl === activeUrl && cachedKey === activeKey) {
    return clientInstance;
  }

  cachedUrl = activeUrl;
  cachedKey = activeKey;

  const valid = isSupabaseConfigured();
  const url = valid ? activeUrl : 'https://placeholder.supabase.co';
  const key = valid ? activeKey : DUMMY_ANON_JWT;

  clientInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return clientInstance;
};

// Dynamic proxy ensuring all calls to supabase.from(...) etc. always target the active client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getSupabase();
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export const setManualSupabaseConfig = (url: string, key: string): { success: boolean; error?: string } => {
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();

  // Validate that the key is NOT a secret key
  if (isSecretApiKey(trimmedKey)) {
    return {
      success: false,
      error: 'Forbidden use of secret API key in browser: The key provided has the "service_role" secret role. Supabase forbids secret keys in web browsers for security. Please provide the "anon" public key from your Supabase Dashboard.',
    };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('web_ascend_sb_url', trimmedUrl);
    localStorage.setItem('web_ascend_sb_key', trimmedKey);
  }

  refreshSupabaseConfig();
  clientInstance = null; // Invalidate cached client to force re-instantiation

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase_config_updated'));
  }

  return { success: true };
};

export const clearManualSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('web_ascend_sb_url');
    localStorage.removeItem('web_ascend_sb_key');
  }
  refreshSupabaseConfig();
  clientInstance = null;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase_config_updated'));
  }
};

