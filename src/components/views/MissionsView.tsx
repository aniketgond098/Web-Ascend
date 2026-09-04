import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Edit2,
  Trash2,
  ShieldAlert,
  Zap,
  Target,
  AlertCircle,
  Clock,
  Sparkles,
  CheckSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MissionModal } from '../modals/MissionModal';
import { ConfirmModal } from '../modals/ConfirmModal';
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
  const [filterType, setFilterType] = useState<'ALL' | 'HIGH' | 'DAILY_CORE' | 'SECONDARY' | 'COMPLETED'>('ALL');
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);
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

    if (filterType === 'HIGH') return m.priority === 'HIGH';
    if (filterType === 'DAILY_CORE') return m.isRequired;
    if (filterType === 'SECONDARY') return !m.isRequired && m.priority !== 'HIGH';
    if (filterType === 'COMPLETED') return isDone;

    return true;
  });

  const handleEdit = (mission: Mission, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMission(mission);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (mission: Mission, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingMission(mission);
  };

  const handleConfirmDelete = () => {
    if (deletingMission) {
      deleteMission(deletingMission.id);
      setDeletingMission(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingMission(null);
    setIsModalOpen(true);
  };

  const totalCount = missions.length;
  const requiredCount = missions.filter((m) => m.isRequired).length;
  const highPriorityCount = missions.filter((m) => m.priority === 'HIGH').length;
  const completedTodayCount = todayRecord.completedMissionIds.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-red-500 font-mono font-bold tracking-widest uppercase">
            <Target className="w-4 h-4" />
            <span>ACTIVE DIRECTIVES // CITY STABILIZATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide mt-1">
            MISSIONS
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all font-['Chakra_Petch'] active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>NEW DIRECTIVE</span>
        </button>
      </div>

      {/* 2. Top Metrics Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">TOTAL DIRECTIVES</span>
          <div className="text-2xl font-bold text-white mt-0.5 font-['Chakra_Petch']">{totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">DAILY CORE</span>
          <div className="text-2xl font-bold text-amber-400 mt-0.5 font-['Chakra_Petch']">{requiredCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">HIGH PRIORITY</span>
          <div className="text-2xl font-bold text-red-400 mt-0.5 font-['Chakra_Petch']">{highPriorityCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">SECURED TODAY</span>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5 font-['Chakra_Petch']">{completedTodayCount}</div>
        </div>
      </div>

      {/* 3. Anti-Farm Protocol Notification */}
      <div className="p-3.5 rounded-xl bg-[#0A0E17] border border-blue-900/20 text-xs flex items-center gap-3 text-slate-400 font-mono">
        <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-[11px] leading-relaxed">
          <strong className="text-slate-300 uppercase">Directive Protocol:</strong> Each mission rewards XP and Spidey Coins once per daily cycle. Repeated toggling safeguards the integrity of your web network.
        </span>
      </div>

      {/* 4. Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directives by codename or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0E17] border border-blue-900/30 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#0A0E17] p-1 rounded-xl border border-blue-900/30 font-mono text-xs">
          {[
            { id: 'ALL', label: 'ALL MISSIONS' },
            { id: 'HIGH', label: 'HIGH PRIORITY' },
            { id: 'DAILY_CORE', label: 'DAILY CORE' },
            { id: 'SECONDARY', label: 'SECONDARY DIRECTIVES' },
            { id: 'COMPLETED', label: 'COMPLETED' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`
                px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap
                ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Missions List */}
      {filteredMissions.length === 0 ? (
        <div className="bg-[#0A0E17] border border-blue-900/20 p-12 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-950/40 border border-blue-900/40 flex items-center justify-center mx-auto text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              NO DIRECTIVES MATCH CRITERIA
            </p>
            <h3 className="text-lg font-bold text-white font-['Chakra_Petch'] mt-1">
              ALL DIRECTIVE VECTORS ARE CLEAR
            </h3>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-300 font-mono text-xs transition-all cursor-pointer"
          >
            + INITIALIZE DIRECTIVE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredMissions.map((mission) => {
            const isCompleted = todayRecord.completedMissionIds.includes(mission.id);
            return (
              <div
                key={mission.id}
                onClick={() => toggleMissionCompletion(mission.id)}
                className={`
                  p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all border select-none
                  ${
                    isCompleted
                      ? 'bg-slate-900/30 border-blue-900/20 opacity-70 hover:border-blue-500/40'
                      : 'bg-[#0F141F] border-blue-900/30 shadow-[0_0_15px_rgba(37,99,235,0.06)] hover:border-blue-500/60'
                  }
                `}
              >
                {/* Left: Checkbox + Title + Description */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    className={`
                      mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all cursor-pointer
                      ${
                        isCompleted
                          ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                          : 'border border-slate-600 hover:border-blue-400'
                      }
                    `}
                  >
                    {isCompleted && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm shadow-[0_0_8px_#3b82f6]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-semibold tracking-wide ${
                          isCompleted ? 'text-slate-400 line-through opacity-70' : 'text-white'
                        }`}
                      >
                        {mission.title}
                      </span>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          mission.priority === 'HIGH'
                            ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                            : mission.priority === 'MEDIUM'
                            ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {mission.priority}
                      </span>

                      {mission.isRequired && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/40 font-mono uppercase">
                          REQUIRED
                        </span>
                      )}

                      {!mission.isActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-mono uppercase">
                          PAUSED
                        </span>
                      )}
                    </div>

                    {mission.description && (
                      <p className="text-xs text-slate-400 font-sans line-clamp-2">
                        {mission.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Rewards + Edit/Delete actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-900/20 font-mono">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-900/40 text-[11px] font-bold">
                      +{mission.xpReward} XP
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40 text-[11px] font-bold flex items-center gap-1">
                      +{mission.essenceReward} COINS
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEdit(mission, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Mission"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(mission, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Mission"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
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
        onDelete={(id) => {
          const m = missions.find((item) => item.id === id);
          if (m) {
            setDeletingMission(m);
          } else {
            deleteMission(id);
          }
        }}
        initialMission={editingMission}
      />

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={!!deletingMission}
        onClose={() => setDeletingMission(null)}
        onConfirm={handleConfirmDelete}
        title="DECOMMISSION MISSION"
        subtitle="SECURITY PROTOCOL OVERRIDE"
        itemName={deletingMission?.title}
        message="Are you sure you want to decommission this mission directive? It will be safely removed from your roster immediately."
        confirmText="DECOMMISSION"
        cancelText="ABORT"
        isDestructive={true}
        icon="trash"
      />
    </div>
  );
};
