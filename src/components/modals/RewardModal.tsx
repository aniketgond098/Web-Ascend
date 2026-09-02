import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Reward } from '../../types';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rewardData: Omit<Reward, 'id' | 'createdAt'>) => void;
  initialReward?: Reward | null;
}

const EMOJI_OPTIONS = ['🎮', '🎬', '🍫', '🍕', '☕', '😴', '🏖️', '📚', '👟', '🍔', '🎵', '🕹️', '🧁', '🎁'];

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReward,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [essenceCost, setEssenceCost] = useState(100);
  const [icon, setIcon] = useState('🎮');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialReward) {
      setName(initialReward.name);
      setDescription(initialReward.description || '');
      setEssenceCost(initialReward.essenceCost);
      setIcon(initialReward.icon);
      setIsActive(initialReward.isActive);
    } else {
      setName('');
      setDescription('');
      setEssenceCost(150);
      setIcon('🎮');
      setIsActive(true);
    }
  }, [initialReward, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim().toUpperCase(),
      description: description.trim() || undefined,
      essenceCost: Number(essenceCost) || 100,
      icon,
      isActive,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialReward ? 'EDIT MARKET ITEM' : 'INITIALIZE CUSTOM REWARD'}
      subtitle="WEB MARKET ASSET REGISTRATION"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-mono">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            REWARD NAME *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 1 HOUR GUITAR PLAY / BUBBLE TEA"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d18] border border-slate-700 text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            CHOOSE ICON
          </label>
          <div className="flex flex-wrap gap-2 p-2 bg-[#090d18] rounded-xl border border-slate-800">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  icon === emoji
                    ? 'bg-[#38bdf8]/20 border-2 border-[#38bdf8] scale-110'
                    : 'hover:bg-slate-800'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
            DESCRIPTION / CONDITIONS
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When and how to redeem this reward..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#090d18] border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8] transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">
            ESSENCE COST *
          </label>
          <div className="relative">
            <input
              type="number"
              min="10"
              max="5000"
              step="10"
              required
              value={essenceCost}
              onChange={(e) => setEssenceCost(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d18] border border-slate-700 text-[#38bdf8] font-bold text-base focus:outline-none focus:border-[#38bdf8]"
            />
            <span className="absolute right-3.5 top-2.5 text-sm text-[#38bdf8] font-bold">
              ◈ ESSENCE
            </span>
          </div>
        </div>

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
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold tracking-wider uppercase hover:brightness-110 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
          >
            {initialReward ? 'UPDATE REWARD' : 'REGISTER TO MARKET'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
