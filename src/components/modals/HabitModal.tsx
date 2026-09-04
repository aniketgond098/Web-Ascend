import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Habit } from '../../types';
import { BASE_REWARDS } from '../../config/progression';
import { Trash2 } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => void;
  onDelete?: (id: string) => void;
  initialHabit?: Habit | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState(BASE_REWARDS.habitXP);
  const [essenceReward, setEssenceReward] = useState(BASE_REWARDS.habitEssence);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name);
      setDescription(initialHabit.description || '');
      setXpReward(initialHabit.xpReward);
      setEssenceReward(initialHabit.essenceReward);
      setIsActive(initialHabit.isActive);
    } else {
      setName('');
      setDescription('');
      setXpReward(BASE_REWARDS.habitXP);
      setEssenceReward(BASE_REWARDS.habitEssence);
      setIsActive(true);
    }
  }, [initialHabit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      xpReward: Number(xpReward) || BASE_REWARDS.habitXP,
      essenceReward: Number(essenceReward) || BASE_REWARDS.habitEssence,
      isActive,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialHabit ? 'EDIT DISCIPLINE ANCHOR' : 'ANCHOR DAILY HABIT'}
      subtitle="DAILY CONSISTENCY PROTOCOL"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-mono">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            HABIT NAME *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wake Up Early / Daily Workout"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d18] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
            DISCIPLINE INTENT / RULE
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Define strict triggers and daily benchmark..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              DAILY XP REWARD
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="100"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-[#38bdf8] font-bold focus:outline-none focus:border-[#38bdf8]"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">XP</span>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              DAILY ESSENCE
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="100"
                value={essenceReward}
                onChange={(e) => setEssenceReward(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-[#ff334b] font-bold focus:outline-none focus:border-[#ff334b]"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">◈</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
          <div>
            {initialHabit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialHabit.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                DELETE PROTOCOL
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(56,189,248,0.4)] cursor-pointer"
            >
              {initialHabit ? 'UPDATE HABIT' : 'ESTABLISH HABIT'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
