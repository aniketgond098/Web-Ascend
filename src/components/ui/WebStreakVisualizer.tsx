import React from 'react';
import { Flame, ShieldCheck, Zap } from 'lucide-react';
import { SpiderIcon } from './SpiderIcon';

interface WebStreakVisualizerProps {
  streak: number;
  longestStreak?: number;
  className?: string;
  showDetails?: boolean;
}

/**
 * WEB STREAK VISUALIZATION
 * Connected node timeline: ●—●—●—●—●—●—● [TODAY]
 * Each successful day adds one connection to the web slinger network.
 */
export const WebStreakVisualizer: React.FC<WebStreakVisualizerProps> = ({
  streak,
  longestStreak = streak,
  className = '',
  showDetails = true,
}) => {
  // Show up to 7 recent nodes in the web timeline
  const nodeCount = 7;
  // If streak >= nodeCount, all 7 are connected. Otherwise streak determines how many are connected leading up to today
  const activeNodesCount = Math.min(streak, nodeCount);

  return (
    <div className={`p-4 rounded-2xl bg-[#0A0E17] border border-red-900/30 font-mono relative overflow-hidden ${className}`}>
      {/* Background Micro Web Grid Accent */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500 fill-red-500/30 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
            WEB STREAK NETWORK
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-950/60 border border-red-800/40 text-[10px] text-red-300 font-bold">
          <span>{streak} {streak === 1 ? 'DAY' : 'DAYS'} CONNECTED</span>
        </div>
      </div>

      {/* Connected Nodes Timeline: ●—●—●—●—●—●—● [TODAY] */}
      <div className="relative py-2 px-1">
        {/* Web connecting vector lines */}
        <div className="flex items-center justify-between relative">
          {/* Horizontal Web Filament Line */}
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 z-0">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-blue-500 to-red-500 transition-all duration-700 shadow-[0_0_8px_#ef4444]"
              style={{
                width: streak > 0 ? `${Math.min(100, Math.max(10, (activeNodesCount / nodeCount) * 100))}%` : '0%',
              }}
            />
          </div>

          {/* Individual Nodes */}
          {Array.from({ length: nodeCount }).map((_, index) => {
            const isToday = index === nodeCount - 1;
            // Node is active if it's within the recent streak window
            const isActive = streak > 0 && index >= nodeCount - activeNodesCount;

            return (
              <div key={index} className="flex flex-col items-center gap-1.5 z-10 relative">
                <div
                  className={`
                    w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300
                    ${
                      isToday
                        ? isActive
                          ? 'w-5 h-5 bg-red-600 border-2 border-white shadow-[0_0_12px_#ef4444] scale-110'
                          : 'w-5 h-5 bg-slate-900 border-2 border-dashed border-red-500/70 text-slate-500'
                        : isActive
                        ? 'bg-red-500 border border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                        : 'bg-slate-900 border border-slate-700'
                    }
                  `}
                >
                  {isToday ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  ) : isActive ? (
                    <div className="w-1 h-1 rounded-full bg-white" />
                  ) : null}
                </div>

                <span className={`text-[8px] font-mono tracking-tighter ${isToday ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                  {isToday ? 'TODAY' : `D-${nodeCount - 1 - index}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-2.5 border-t border-red-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Each successful day adds one connection to your web network.
          </span>
          <span className="text-slate-500">
            RECORD: <strong className="text-slate-300">{longestStreak} DAYS</strong>
          </span>
        </div>
      )}
    </div>
  );
};
