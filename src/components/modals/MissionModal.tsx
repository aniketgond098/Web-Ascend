import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Mission, Priority } from '../../types';
import { BASE_REWARDS } from '../../config/progression';

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (missionData: Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialMission?: Mission | null;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMission,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [xpReward, setXpReward] = useState(BASE_REWARDS.missionXP);
  const [essenceReward, setEssenceReward] = useState(BASE_REWARDS.missionEssence);
  const [isRequired, setIsRequired] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialMission) {
      setTitle(initialMission.title);
      setDescription(initialMission.description || '');
      setPriority(initialMission.priority);
      setXpReward(initialMission.xpReward);
      setEssenceReward(initialMission.essenceReward);
      setIsRequired(initialMission.isRequired);
      setIsActive(initialMission.isActive);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setXpReward(BASE_REWARDS.missionXP);
      setEssenceReward(BASE_REWARDS.missionEssence);
      setIsRequired(true);
      setIsActive(true);
    }
  }, [initialMission, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      xpReward: Number(xpReward) || BASE_REWARDS.missionXP,
      essenceReward: Number(essenceReward) || BASE_REWARDS.missionEssence,
      isRequired,
      isActive,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMission ? 'EDIT MISSION' : 'INITIALIZE MISSION'}
      subtitle="SYSTEM PROTOCOL ENTRY"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-mono">
        {/* Title */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            MISSION DIRECTIVE / TITLE *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete Mathematics Assignment"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d18] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
            DETAILS / OBJECTIVE PARAMETERS
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key milestones or steps to complete..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] transition-colors resize-none"
          />
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            PRIORITY LEVEL
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`
                  py-2 px-3 rounded-lg border text-xs font-bold transition-all
                  ${
                    priority === p
                      ? p === 'HIGH'
                        ? 'bg-[#7f1d1d]/40 border-[#ff334b] text-[#ff334b]'
                        : p === 'MEDIUM'
                        ? 'bg-[#0369a1]/40 border-[#38bdf8] text-[#38bdf8]'
                        : 'bg-[#1e293b]/60 border-slate-500 text-slate-300'
                      : 'bg-[#090d18] border-slate-800 text-slate-500 hover:text-slate-300'
                  }
                `}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Reward Tuning */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              XP REWARD
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="200"
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-[#38bdf8] font-bold focus:outline-none focus:border-[#38bdf8]"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">XP</span>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">
              ESSENCE REWARD
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="200"
                value={essenceReward}
                onChange={(e) => setEssenceReward(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-[#ff334b] font-bold focus:outline-none focus:border-[#ff334b]"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-500">◈</span>
            </div>
          </div>
        </div>

        {/* Requirement & Active Switches */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="w-4 h-4 rounded bg-[#090d18] border-slate-700 text-[#ff334b] accent-[#ff334b]"
            />
            <span>REQUIRED FOR PERFECT DAY & STREAK</span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 font-semibold"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#b91c1c] to-[#ff334b] text-white font-bold tracking-wider hover:brightness-110 shadow-[0_0_15px_rgba(255,51,75,0.4)]"
          >
            {initialMission ? 'UPDATE MISSION' : 'ENGAGE MISSION'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
