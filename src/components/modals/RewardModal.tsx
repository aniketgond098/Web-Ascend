import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Reward } from '../../types';
import { SPIDEY_GEAR_REGISTRY, SpideyMarketBadge } from '../ui/SpideyMarketBadge';
import { SpideyCoinIcon } from '../ui/SpideyCoinDisplay';
import { SpiderIcon } from '../ui/SpiderIcon';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rewardData: Omit<Reward, 'id' | 'createdAt'>) => void;
  initialReward?: Reward | null;
}

const GEAR_OPTIONS = Object.keys(SPIDEY_GEAR_REGISTRY);

export const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialReward,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [essenceCost, setEssenceCost] = useState(150);
  const [icon, setIcon] = useState('NEURAL_SIM');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (initialReward) {
      setName(initialReward.name);
      setDescription(initialReward.description || '');
      setEssenceCost(initialReward.essenceCost);
      setIcon(initialReward.icon || 'NEURAL_SIM');
      setIsActive(initialReward.isActive);
    } else {
      setName('');
      setDescription('');
      setEssenceCost(150);
      setIcon('NEURAL_SIM');
      setIsActive(true);
    }
  }, [initialReward, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim().toUpperCase(),
      description: description.trim() || undefined,
      essenceCost: Math.max(10, Number(essenceCost) || 100),
      icon,
      isActive,
    });
    onClose();
  };

  const selectedGear = SPIDEY_GEAR_REGISTRY[icon] || SPIDEY_GEAR_REGISTRY.NEURAL_SIM;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialReward ? 'EDIT MARKET ITEM' : 'FABRICATE NEW REWARD'}
      subtitle="WEB MARKET // TACTICAL UPGRADE FABRICATION"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-mono">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            REWARD CODENAME / UPGRADE TITLE *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 1 HOUR GUITAR IMPROV / SPECIAL COFFEE BREW"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d18] border border-blue-900/40 text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <SpiderIcon size={14} color="#EF4444" />
              <span>SPIDER-MAN GEAR BADGE & CLASSIFICATION</span>
            </label>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{ color: selectedGear.color, borderColor: `${selectedGear.color}40`, backgroundColor: `${selectedGear.color}15` }}
            >
              {selectedGear.techLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-[#070A10] rounded-2xl border border-blue-900/30 max-h-56 overflow-y-auto custom-scrollbar">
            {GEAR_OPTIONS.map((gearKey) => {
              const gear = SPIDEY_GEAR_REGISTRY[gearKey];
              const isSelected = icon === gearKey;

              return (
                <button
                  key={gearKey}
                  type="button"
                  onClick={() => setIcon(gearKey)}
                  className={`p-2 rounded-xl flex items-center gap-2.5 transition-all text-left border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-red-950/60 to-blue-950/40 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)] scale-[1.02]'
                      : 'bg-[#0B0F19] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <SpideyMarketBadge iconKey={gearKey} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate font-['Chakra_Petch'] leading-tight">
                      {gear.name}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase truncate">
                      {gear.category}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            DESCRIPTION / UNLOCK PROTOCOL
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When and how this reward may be redeemed in real life..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#090d18] border border-blue-900/40 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 transition-colors resize-none text-xs font-sans"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">
            SPIDEY COINS COST *
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min="10"
              max="10000"
              step="10"
              required
              value={essenceCost}
              onChange={(e) => setEssenceCost(Number(e.target.value))}
              className="w-full pl-3.5 pr-28 py-2.5 rounded-xl bg-[#090d18] border border-amber-500/40 text-amber-300 font-bold text-base focus:outline-none focus:border-amber-400"
            />
            <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none text-xs font-bold text-amber-300">
              <SpideyCoinIcon size={16} />
              <span>SPIDEY COINS</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 font-semibold cursor-pointer"
          >
            ABORT
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold tracking-wider uppercase hover:from-red-500 hover:to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.35)] cursor-pointer font-['Chakra_Petch']"
          >
            {initialReward ? 'UPDATE SPECIFICATION' : 'FABRICATE REWARD'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
