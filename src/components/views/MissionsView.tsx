import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HudCard } from '../ui/HudCard';
import { MissionModal } from '../modals/MissionModal';
import { Mission, Priority } from '../../types';

export const MissionsView: React.FC = () => {
  const {
    missions,
    dailyRecords,
    todayDate,
    createMission,
    updateMission,
    deleteMission,
    toggleMissionCompletion,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'REQUIRED' | 'HIGH' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const todayRecord = dailyRecords[todayDate] || {
    date: todayDate,
    completedMissionIds: [],
    completedHabitIds: [],
    isPerfectDay: false,
    xpEarned: 0,
    essenceEarned: 0,
    totalRequiredMissions: 0,
    totalActiveHabits: 0,
    status: 'IN_PROGRESS',
  };

  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const isDone = todayRecord.completedMissionIds.includes(m.id);

    if (filterType === 'REQUIRED') return m.isRequired;
    if (filterType === 'HIGH') return m.priority === 'HIGH';
    if (filterType === 'ACTIVE') return m.isActive;
    if (filterType === 'COMPLETED') return isDone;

    return true;
  });

  const handleEdit = (mission: Mission, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMission(mission);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this mission directive? Historical completions will remain preserved in ledger.')) {
      deleteMission(id);
    }
  };

  const handleOpenCreate = () => {
    setEditingMission(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#ff334b] font-bold tracking-widest uppercase">
            <Zap className="w-4 h-4" />
            <span>DIRECTIVE MANAGEMENT // PROTOCOLS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wide">
            MISSION DIRECTIVES
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#ff334b] text-white text-xs font-bold tracking-wider uppercase hover:brightness-110 shadow-[0_0_20px_rgba(255,51,75,0.4)] transition-all font-['Chakra_Petch']"
        >
          <Plus className="w-4 h-4" />
          <span>INITIALIZE NEW MISSION</span>
        </button>
      </div>

      {/* Anti-Farm & Integrity Information Banner */}
      <div className="p-3.5 rounded-xl bg-[#0b1220] border border-slate-800 text-xs flex items-center gap-3 text-slate-400">
        <ShieldAlert className="w-4 h-4 text-[#38bdf8] shrink-0" />
        <span className="text-[11px] leading-relaxed">
          <strong>Anti-Farm Protocol Active:</strong> Each mission awards its daily XP and Essence once per 24-hour cycle. Uncompleting does not allow multiple payouts.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter missions by directive codename or parameters..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090d18] border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#ff334b] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#090d18] p-1 rounded-xl border border-slate-800 text-xs">
          {(['ALL', 'REQUIRED', 'HIGH', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`
                px-3 py-1.5 rounded-lg font-bold transition-all
                ${
                  filterType === tab
                    ? 'bg-[#ff334b] text-white shadow-[0_0_10px_rgba(255,51,75,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Missions List */}
      {filteredMissions.length === 0 ? (
        <HudCard className="p-12 text-center space-y-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            ZERO MISSIONS MATCHING CRITERIA
          </p>
          <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
            THE WEB IS CLEAR. ENGAGE A NEW MISSION.
          </h3>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-[#0e1628] border border-slate-700 hover:border-[#ff334b] text-white font-bold text-xs"
          >
            + CREATE MISSION
          </button>
        </HudCard>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredMissions.map((mission) => {
            const isCompleted = todayRecord.completedMissionIds.includes(mission.id);
            return (
              <HudCard
                key={mission.id}
                interactive={true}
                onClick={() => toggleMissionCompletion(mission.id)}
                className={`
                  p-4 transition-all
                  ${
                    isCompleted
                      ? 'opacity-70 bg-[#060911]/80'
                      : 'hover:border-[#ff334b]/60'
                  }
                `}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkbox + Title + Description */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      className={`
                        mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all
                        ${
                          isCompleted
                            ? 'bg-[#ff334b] text-white shadow-[0_0_10px_rgba(255,51,75,0.6)]'
                            : 'border-2 border-slate-600 group-hover:border-[#ff334b]'
                        }
                      `}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-bold tracking-wide ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-white'
                          }`}
                        >
                          {mission.title}
                        </span>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            mission.priority === 'HIGH'
                              ? 'bg-[#7f1d1d]/50 text-[#ff334b] border border-[#ff334b]/40'
                              : mission.priority === 'MEDIUM'
                              ? 'bg-[#0369a1]/40 text-[#38bdf8] border border-[#38bdf8]/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mission.priority}
                        </span>

                        {mission.isRequired && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e293b] text-amber-400 border border-amber-400/30">
                            REQUIRED
                          </span>
                        )}

                        {!mission.isActive && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-500">
                            PAUSED
                          </span>
                        )}
                      </div>

                      {mission.description && (
                        <p className="text-xs text-slate-400 font-mono">
                          {mission.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Rewards + Edit/Delete actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-[#0369a1]/20 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                        +{mission.xpReward} XP
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#7f1d1d]/20 text-[#ff334b] border border-[#ff334b]/30 font-bold">
                        +{mission.essenceReward} ◈
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(mission, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Mission"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(mission.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff334b] hover:bg-slate-800 transition-colors"
                        title="Delete Mission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </HudCard>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Edit */}
      <MissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (editingMission) {
            updateMission(editingMission.id, data);
          } else {
            createMission(data);
          }
        }}
        initialMission={editingMission}
      />
    </div>
  );
};
