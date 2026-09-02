import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

const MainLayout: React.FC = () => {
  const { activeTab, profile } = useApp();
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);

  React.useEffect(() => {
    // Check if new operative needs codename assignment
    if (profile.username === 'OPERATIVE' && profile.totalXP === 0) {
      setIsOnboardingOpen(true);
    }
  }, [profile.username, profile.totalXP]);

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
            <span>Protocol initialized // ready for input</span>
            <span>&copy; WEB ASCEND // ASCENSION PROTOCOL v2.4</span>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Modals & Celebrations */}
      <CelebrationModals />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
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
