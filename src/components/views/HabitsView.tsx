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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HudCard } from '../ui/HudCard';
import { HabitModal } from '../modals/HabitModal';
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this habit anchor? Historical records will remain intact.')) {
      deleteHabit(id);
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#38bdf8] font-bold tracking-widest uppercase">
            <Zap className="w-4 h-4" />
            <span>NEURAL PATTERNS // HABIT MATRIX</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wide">
            DAILY DISCIPLINE HABITS
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white text-xs font-bold tracking-wider uppercase hover:brightness-110 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all font-['Chakra_Petch']"
        >
          <Plus className="w-4 h-4" />
          <span>ANCHOR NEW HABIT</span>
        </button>
      </div>

      {/* Habits Summary Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HudCard className="p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            ACTIVE ANCHORS
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-white">
            {activeCount} HABITS
          </div>
        </HudCard>

        <HudCard className="p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            COMPLETED TODAY
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-[#38bdf8]">
            {completedTodayCount} / {activeCount}
          </div>
        </HudCard>

        <HudCard variant="crimson" className="p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            DISCIPLINE PROTOCOL
          </span>
          <div className="text-sm font-bold font-mono text-[#ff334b] flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>DAILY RECURRENCE</span>
          </div>
        </HudCard>
      </div>

      {/* Habits List */}
      {habits.length === 0 ? (
        <HudCard className="p-12 text-center space-y-4">
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            NO HABITS REGISTERED
          </p>
          <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
            BUILD YOUR DAILY DISCIPLINE.
          </h3>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-[#0e1628] border border-slate-700 hover:border-[#38bdf8] text-white font-bold text-xs"
          >
            + ANCHOR HABIT
          </button>
        </HudCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const isCompleted = todayRecord.completedHabitIds.includes(habit.id);
            return (
              <HudCard
                key={habit.id}
                interactive={true}
                onClick={() => toggleHabitCompletion(habit.id)}
                className={`
                  p-5 flex flex-col justify-between transition-all
                  ${
                    !habit.isActive
                      ? 'opacity-50 border-dashed border-slate-800'
                      : isCompleted
                      ? 'bg-[#080d1a]/80 border-[#38bdf8]/40'
                      : 'hover:border-[#38bdf8]/60'
                  }
                `}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`
                          w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all
                          ${
                            isCompleted
                              ? 'bg-[#38bdf8] text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.6)]'
                              : 'border-2 border-slate-600 group-hover:border-[#38bdf8]'
                          }
                        `}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />}
                      </button>

                      <h3
                        className={`text-base font-bold font-['Chakra_Petch'] tracking-wide ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {habit.name}
                      </h3>
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161f33] border border-slate-700 text-xs text-amber-400">
                      <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                      <span className="font-bold">{habit.currentStreak}d</span>
                    </div>
                  </div>

                  {habit.description && (
                    <p className="text-xs text-slate-400 pl-8 mb-4">
                      {habit.description}
                    </p>
                  )}
                </div>

                {/* Bottom Stats & Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#38bdf8] font-bold">+{habit.xpReward} XP</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-[#ff334b] font-bold">+{habit.essenceReward} ◈</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleTogglePause(habit, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title={habit.isActive ? 'Pause Habit' : 'Activate Habit'}
                    >
                      {habit.isActive ? (
                        <PauseCircle className="w-3.5 h-3.5" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleEdit(habit, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Habit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(habit.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff334b] hover:bg-slate-800 transition-colors"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </HudCard>
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
        initialHabit={editingHabit}
      />
    </div>
  );
};
