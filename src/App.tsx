import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Database } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { WebBackground } from './components/ui/WebBackground';
import { Sidebar } from './components/navigation/Sidebar';
import { Header } from './components/navigation/Header';
import { MobileNav } from './components/navigation/MobileNav';

// Views
import { TodayView } from './components/views/TodayView';
import { MissionsView } from './components/views/MissionsView';
import { HabitsView } from './components/views/HabitsView';
import { TrackingView } from './components/views/TrackingView';
import { RewardsView } from './components/views/RewardsView';
import { AscendView } from './components/views/AscendView';
import { ProfileView } from './components/views/ProfileView';

// Modals
import { CelebrationModals } from './components/modals/CelebrationModals';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { AuthTerminal } from './components/auth/AuthTerminal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { AccountModal } from './components/modals/AccountModal';
import { MigrationPromptModal } from './components/modals/MigrationPromptModal';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    profile,
    user,
    syncStatus,
    authModalOpen,
    setAuthModalOpen,
    supabaseConfigModalOpen,
    setSupabaseConfigModalOpen,
    accountModalOpen,
    setAccountModalOpen,
    migrationModalOpen,
    setMigrationModalOpen,
    importLocalDataToCloud,
    dismissMigration,
    signOut,
    updateProfile,
    refreshCloudData,
    reloadAuthAndConfig,
    hasSecretKeyError,
    isMissingTablesError,
    checkMissingTables,
  } = useApp();

  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [isMigrating, setIsMigrating] = React.useState(false);

  React.useEffect(() => {
    // Only prompt for codename once on very first launch if operative has not been configured
    const hasSeenOnboarding = localStorage.getItem('web_ascend_onboarding_completed');
    if (!hasSeenOnboarding && profile.username === 'OPERATIVE' && profile.totalXP === 0 && !user) {
      setIsOnboardingOpen(true);
    }
  }, [profile.username, profile.totalXP, user]);

  const handleImport = async () => {
    setIsMigrating(true);
    try {
      await importLocalDataToCloud();
    } finally {
      setIsMigrating(false);
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'TODAY':
        return <TodayView />;
      case 'MISSIONS':
        return <MissionsView />;
      case 'HABITS':
        return <HabitsView />;
      case 'TRACKING':
        return <TrackingView />;
      case 'REWARDS':
        return <RewardsView />;
      case 'ASCEND':
        return <AscendView />;
      case 'PROFILE':
        return <ProfileView />;
      default:
        return <TodayView />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05070A] text-slate-300 flex flex-col selection:bg-red-600 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Dynamic Cybernetic Spider Web Geometry Background */}
      <WebBackground />

      {/* Main Container Layout */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* Desktop Sidebar (Left) */}
        <Sidebar />

        {/* Content Area (Right) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top HUD Header */}
          <Header />

          {/* Warning Banner if Secret API Key was configured */}
          {hasSecretKeyError && (
            <div className="bg-red-950/90 border-b border-red-500/50 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-red-200 gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                <span>
                  <strong>SECRET KEY CONFLICT:</strong> A Supabase <code className="bg-black/50 px-1 py-0.5 rounded text-red-300 font-bold">service_role</code> secret key was detected. Secret keys are blocked in browsers for security.
                </span>
              </div>
              <button
                onClick={() => setSupabaseConfigModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                Replace with Anon Key
              </button>
            </div>
          )}

          {/* Warning Banner if Supabase tables are missing */}
          {isMissingTablesError && !hasSecretKeyError && (
            <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono text-amber-200 gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  <strong>SUPABASE TABLES NOT FOUND:</strong> Connected to Supabase, but database tables (<code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-bold">public.profiles</code>) must be created in SQL Editor.
                </span>
              </div>
              <button
                onClick={() => setSupabaseConfigModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0 cursor-pointer shadow-[0_0_10px_rgba(217,119,6,0.3)]"
              >
                Run 1-Click SQL Script
              </button>
            </div>
          )}

          {/* View Container with Transitions */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Sleek Interface Footer */}
          <footer className="h-12 border-t border-blue-900/10 px-4 sm:px-8 flex items-center justify-between text-[10px] text-slate-600 font-mono uppercase tracking-widest bg-[#06080F] shrink-0 mt-auto">
            <span>Protocol initialized // persistent cloud database active</span>
            <span>&copy; WEB ASCEND // SUPABASE ARCHITECTURE v3.0</span>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Modals & Celebrations */}
      <CelebrationModals />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          localStorage.setItem('web_ascend_onboarding_completed', 'true');
          setIsOnboardingOpen(false);
        }}
      />

      {/* Supabase Authentication Terminal */}
      <AuthTerminal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenConfig={() => {
          setAuthModalOpen(false);
          setSupabaseConfigModalOpen(true);
        }}
        onContinueDemo={() => setAuthModalOpen(false)}
      />

      {/* Supabase Configuration & SQL Schema Modal */}
      <SupabaseConfigModal
        isOpen={supabaseConfigModalOpen}
        onClose={() => setSupabaseConfigModalOpen(false)}
        onConfigChanged={() => {
          reloadAuthAndConfig();
        }}
      />

      {/* Operative Account Settings Modal */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        user={user}
        profile={profile}
        syncStatus={syncStatus}
        onSignOut={signOut}
        onOpenConfig={() => {
          setAccountModalOpen(false);
          setSupabaseConfigModalOpen(true);
        }}
        onUpdateUsername={async (newName) => {
          await updateProfile({ username: newName });
        }}
      />

      {/* Local Storage Migration Prompt Modal */}
      <MigrationPromptModal
        isOpen={migrationModalOpen}
        onImport={handleImport}
        onStartFresh={dismissMigration}
        importing={isMigrating}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
