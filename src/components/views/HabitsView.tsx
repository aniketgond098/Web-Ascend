import React, { useState } from 'react';
import {
  Plus,
  Flame,
  CheckCircle2,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Zap,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HabitModal } from '../modals/HabitModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { Habit } from '../../types';

export const HabitsView: React.FC = () => {
  const {
    habits,
    dailyRecords,
    todayDate,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
  } = useApp();

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
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

  const handleEdit = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingHabit(habit);
  };

  const handleConfirmDelete = () => {
    if (deletingHabit) {
      deleteHabit(deletingHabit.id);
      setDeletingHabit(null);
    }
  };

  const handleTogglePause = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    updateHabit(habit.id, { isActive: !habit.isActive });
  };

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const activeCount = habits.filter((h) => h.isActive).length;
  const completedTodayCount = todayRecord.completedHabitIds.length;
  const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.currentStreak), 0) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-400 font-mono font-bold tracking-widest uppercase">
            <CheckSquare className="w-4 h-4" />
            <span>DAILY ANCHORS // DISCIPLINE REINFORCEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide mt-1">
            DAILY PROTOCOLS
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all font-['Chakra_Petch'] active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>NEW PROTOCOL</span>
        </button>
      </div>

      {/* 2. Habits Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
            ACTIVE PROTOCOLS
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-white mt-0.5">
            {activeCount} PROTOCOLS
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
            STABILIZED TODAY
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-blue-400 mt-0.5">
            {completedTodayCount} / {activeCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
            MAX WEB STREAK
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-red-500 mt-0.5 flex items-center gap-1.5">
            <Flame className="w-5 h-5 fill-red-500/20" />
            <span>{maxStreak} DAYS</span>
          </div>
        </div>
      </div>

      {/* 3. Habits List */}
      {habits.length === 0 ? (
        <div className="bg-[#0A0E17] border border-blue-900/20 p-12 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-950/40 border border-blue-900/40 flex items-center justify-center mx-auto text-blue-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              NO HABIT ANCHORS INITIALIZED
            </p>
            <h3 className="text-lg font-bold text-white font-['Chakra_Petch'] mt-1">
              BUILD YOUR DAILY DISCIPLINE FOUNDATION
            </h3>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 font-mono text-xs transition-all cursor-pointer"
          >
            + ANCHOR FIRST HABIT
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const isCompleted = todayRecord.completedHabitIds.includes(habit.id);
            return (
              <div
                key={habit.id}
                onClick={() => toggleHabitCompletion(habit.id)}
                className={`
                  p-5 rounded-xl flex flex-col justify-between transition-all cursor-pointer border select-none
                  ${
                    !habit.isActive
                      ? 'opacity-50 border-dashed border-slate-800 bg-[#0A0E17]/50'
                      : isCompleted
                      ? 'bg-slate-900/30 border-blue-900/20 opacity-70 hover:border-blue-500/40'
                      : 'bg-[#0F141F] border-blue-900/30 shadow-[0_0_15px_rgba(37,99,235,0.06)] hover:border-blue-500/60'
                  }
                `}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        className={`
                          w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all cursor-pointer
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

                      <h3
                        className={`text-sm font-semibold tracking-wide truncate ${
                          isCompleted ? 'text-slate-400 line-through opacity-70' : 'text-white'
                        }`}
                      >
                        {habit.name}
                      </h3>
                    </div>

                    {/* Streak & Frequency Badge */}
                    <div className="flex items-center gap-1.5 shrink-0 font-mono">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 uppercase font-bold">
                        DAILY
                      </span>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/40 border border-red-900/30 text-[11px] text-red-400">
                        <Flame className="w-3 h-3 fill-red-500/30" />
                        <span className="font-bold">{habit.currentStreak}d</span>
                      </div>
                    </div>
                  </div>

                  {habit.description && (
                    <p className="text-xs text-slate-400 pl-8 mb-4 font-sans line-clamp-2">
                      {habit.description}
                    </p>
                  )}
                </div>

                {/* Bottom Stats & Actions */}
                <div className="pt-3 border-t border-blue-900/20 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">+{habit.xpReward} XP</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-amber-300 font-bold">+{habit.essenceReward} COINS</span>
                    <span className="text-slate-700">|</span>
                    {isCompleted ? (
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">STABILIZED</span>
                    ) : (
                      <span className="text-[10px] text-blue-400 uppercase">PENDING</span>
                    )}
                    {!habit.isActive && (
                      <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-800 uppercase">PAUSED</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleTogglePause(habit, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title={habit.isActive ? 'Pause Habit' : 'Activate Habit'}
                    >
                      {habit.isActive ? (
                        <PauseCircle className="w-3.5 h-3.5" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleEdit(habit, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Habit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(habit, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Habit"
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

      {/* Create / Edit Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (editingHabit) {
            updateHabit(editingHabit.id, data);
          } else {
            createHabit(data);
          }
        }}
        onDelete={(id) => {
          const h = habits.find((item) => item.id === id);
          if (h) {
            setDeletingHabit(h);
          } else {
            deleteHabit(id);
          }
        }}
        initialHabit={editingHabit}
      />

      {/* Confirmation Modal for Habit Deletion */}
      <ConfirmModal
        isOpen={!!deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={handleConfirmDelete}
        title="DELETE HABIT PROTOCOL"
        subtitle="SECURITY PROTOCOL OVERRIDE"
        itemName={deletingHabit?.name}
        message="Are you sure you want to delete this habit directive? It will be removed from your active daily protocols immediately."
        confirmText="DELETE PROTOCOL"
        cancelText="ABORT"
        isDestructive={true}
        icon="trash"
      />
    </div>
  );
};
