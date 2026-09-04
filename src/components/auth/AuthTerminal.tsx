import React, { useState } from 'react';
import {
  Shield,
  Key,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, hasSecretKeyConfigured } from '../../lib/supabase';
import { supabaseService } from '../../services/supabaseService';
import { useApp } from '../../context/AppContext';

interface AuthTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig?: () => void;
  onContinueDemo?: () => void;
}

type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD';

export const AuthTerminal: React.FC<AuthTerminalProps> = ({
  isOpen,
  onClose,
  onOpenConfig,
  onContinueDemo,
}) => {
  const { setUserAndSync, isMissingTablesError } = useApp();
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codename, setCodename] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (hasSecretKeyConfigured()) {
      setErrorMsg(
        'Forbidden use of secret API key in browser: A secret "service_role" key was supplied. Please click "Supabase Config / SQL" below, clear the key, and paste your public "anon" key from Supabase Project Settings -> API.'
      );
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMsg('Supabase is not configured yet. Click "SUPABASE CONFIG" below to provide your project credentials.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'SIGN_IN') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (data.session?.user || data.user) {
          const authenticatedUser = data.session?.user || data.user;
          if (setUserAndSync) {
            await setUserAndSync(authenticatedUser);
          }
          setSuccessMsg('AUTHENTICATION GRANTED // Neural link active. Synced to PostgreSQL.');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else if (mode === 'SIGN_UP') {
        if (!password || password.length < 6) {
          throw new Error('Security requirement: Password must be at least 6 characters.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: codename.trim() || 'OPERATIVE',
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Initialize starter schema rows
          try {
            await supabaseService.initializeNewUser(data.user.id, codename.trim() || 'OPERATIVE');
          } catch (initErr) {
            console.warn('Initial setup fallback:', initErr);
          }

          // In Supabase, if "Confirm email" is enabled, data.session is null until the email link is clicked
          if (!data.session) {
            setSuccessMsg(
              'ACCOUNT CREATED! Supabase requires email verification by default. Please check your inbox and click the confirm link, then switch to SIGN IN. (Developer tip: To log in without confirming email, go to Supabase Dashboard -> Authentication -> Providers -> Email and turn off "Confirm email").'
            );
            return;
          }

          // If session is immediately active
          if (setUserAndSync) {
            await setUserAndSync(data.user);
          }

          setSuccessMsg('ACCOUNT REGISTERED // Neural link active. Welcome to WEB ASCEND.');
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else if (mode === 'FORGOT_PASSWORD') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setSuccessMsg('RECOVERY DISPATCHED // Check your inbox for the password reset protocol link.');
      }
    } catch (err: any) {
      const rawMsg = err?.message || String(err || '');
      console.warn('Auth operation result:', rawMsg);
      const lower = rawMsg.toLowerCase();

      if (lower.includes('secret api key') || lower.includes('forbidden use of secret')) {
        setErrorMsg(
          'Forbidden use of secret API key in browser: Supabase rejected this request because a "service_role" secret key is active. Browser clients must use the public "anon" key. Click "Supabase Config / SQL" below to replace it.'
        );
      } else if (lower.includes('invalid login credentials')) {
        setErrorMsg(
          'Invalid login credentials. Have you registered this account yet on your Supabase project? If this is your first time, click the "SIGN UP" tab above to create your account.'
        );
      } else if (lower.includes('email not confirmed')) {
        setErrorMsg(
          'Email not confirmed yet! Supabase requires confirming your email by default. Please click the link sent to your inbox, or in your Supabase Dashboard go to Authentication -> Providers -> Email and turn off "Confirm email" for instant login.'
        );
      } else if (lower.includes('user already registered')) {
        setErrorMsg(
          'This email is already registered in your Supabase project. Switch to the "SIGN IN" tab to enter your passcode.'
        );
      } else if (lower.includes('signup requires a valid password') || lower.includes('password should be at least')) {
        setErrorMsg('Security requirement: Password must be at least 6 characters.');
      } else {
        setErrorMsg(rawMsg || 'Authentication error encountered.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-[#080C14] border border-blue-500/40 shadow-[0_0_50px_rgba(2,132,199,0.2)] overflow-hidden">
        {/* Spider HUD Top Banner */}
        <div className="px-6 py-5 border-b border-blue-900/30 bg-[#060910] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(230,43,58,0.25)]">
              <span className="text-xl">🕷</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest font-['Chakra_Petch'] flex items-center gap-2">
                <span>WEB ASCEND</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-400 font-mono">
                  AUTH MAINFRAME
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                PostgreSQL Cloud Sync Source of Truth
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-blue-900/20 bg-[#070B14]">
          <button
            type="button"
            onClick={() => {
              setMode('SIGN_IN');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              mode === 'SIGN_IN'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SIGN_UP');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              mode === 'SIGN_UP'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Mode Context Hint */}
        <div className="px-6 py-2 bg-blue-950/20 border-b border-blue-900/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>
            {mode === 'SIGN_IN'
              ? 'Enter credentials to connect to your Supabase PostgreSQL cloud operative record.'
              : mode === 'SIGN_UP'
              ? 'First time operative? Create your account in Supabase PostgreSQL.'
              : 'Dispatches password reset instructions via Supabase.'}
          </span>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono text-xs">
          {hasSecretKeyConfigured() && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-red-400 block mb-0.5">Secret Key Configuration Detected</strong>
                A Supabase <code className="bg-black/40 px-1 rounded text-red-300">service_role</code> secret key is present. Web browsers are strictly forbidden from using secret keys.
                {onOpenConfig && (
                  <button
                    type="button"
                    onClick={onOpenConfig}
                    className="mt-2 block px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800/80 text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                  >
                    Open Supabase Config &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="text-[11px] leading-relaxed flex-1">
                <div>{errorMsg}</div>
                {errorMsg.includes('SIGN UP') && mode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGN_UP');
                      setErrorMsg(null);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-900/50 hover:bg-blue-800/70 text-blue-200 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Switch to SIGN UP tab</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {errorMsg.includes('SIGN IN') && mode === 'SIGN_UP' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('SIGN_IN');
                      setErrorMsg(null);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-900/50 hover:bg-blue-800/70 text-blue-200 font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Switch to SIGN IN tab</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="text-[11px] leading-relaxed">{successMsg}</div>
            </div>
          )}

          {mode === 'SIGN_UP' && (
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                OPERATIVE CODENAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={codename}
                  onChange={(e) => setCodename(e.target.value)}
                  placeholder="e.g. Peter Parker, Arachnid, Ghost"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operative@web-ascend.hq"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'FORGOT_PASSWORD' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  SECURITY PASSCODE
                </label>
                {mode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_PASSWORD');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Forgot passcode?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold tracking-wider uppercase font-['Chakra_Petch'] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,43,58,0.3)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>LINKING NEURAL NETWORK...</span>
            ) : mode === 'SIGN_IN' ? (
              <>
                <span>ESTABLISH SECURE LINK</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : mode === 'SIGN_UP' ? (
              <>
                <span>INITIALIZE OPERATIVE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>DISPATCH RESET PROTOCOL</span>
            )}
          </button>

          {mode === 'FORGOT_PASSWORD' && (
            <button
              type="button"
              onClick={() => setMode('SIGN_IN')}
              className="w-full text-center text-slate-400 hover:text-white text-xs pt-1"
            >
              &larr; Back to Sign In
            </button>
          )}

          {/* Bottom helper actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            {onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Config / SQL</span>
              </button>
            )}

            {onContinueDemo && (
              <button
                type="button"
                onClick={onContinueDemo}
                className="text-slate-500 hover:text-slate-300 transition-colors underline"
              >
                Offline / Preview Mode
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
