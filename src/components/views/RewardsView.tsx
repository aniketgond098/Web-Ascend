import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  ShoppingBag,
  History,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RewardModal } from '../modals/RewardModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { Reward } from '../../types';
import { formatTimeHUD, formatReadableDate } from '../../utils/date';
import { SpideyCoinIcon } from '../ui/SpideyCoinDisplay';
import { SpiderIcon } from '../ui/SpiderIcon';
import { SpideyMarketBadge, resolveSpideyGear } from '../ui/SpideyMarketBadge';

export const RewardsView: React.FC = () => {
  const {
    profile,
    rewards,
    purchases,
    essenceTransactions,
    purchaseReward,
    createReward,
    updateReward,
    deleteReward,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'MARKET' | 'LEDGER'>('MARKET');
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [deletingReward, setDeletingReward] = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'FOCUS' | 'LEISURE' | 'UPGRADE' | 'GEAR'>('ALL');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'EARNED' | 'SPENT'>('ALL');
  const [purchasePulseId, setPurchasePulseId] = useState<string | null>(null);

  const handleEdit = (reward: Reward, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleDelete = (reward: Reward, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingReward(reward);
  };

  const handleConfirmDelete = () => {
    if (deletingReward) {
      deleteReward(deletingReward.id);
      setDeletingReward(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingReward(null);
    setIsModalOpen(true);
  };

  const handlePurchase = (reward: Reward) => {
    if (profile.currentEssence >= reward.essenceCost) {
      setPurchasePulseId(reward.id);
      setTimeout(() => setPurchasePulseId(null), 1200);
      purchaseReward(reward.id);
    }
  };

  const filteredRewards = rewards.filter((r) => {
    if (!r.isActive) return false;
    if (categoryFilter === 'ALL') return true;
    return r.category === categoryFilter;
  });

  const filteredTransactions = essenceTransactions.filter((tx) => {
    if (ledgerFilter === 'EARNED') return tx.amount > 0;
    if (ledgerFilter === 'SPENT') return tx.amount < 0;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-bold tracking-widest uppercase">
            <SpideyCoinIcon size={14} />
            <span>ACQUIRE UPGRADES // REAL-WORLD REINFORCEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide mt-1">
            WEB MARKET
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Prominent Spidey Coin Display */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0A0E17] to-amber-950/20 border border-amber-500/40 font-mono shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <SpideyCoinIcon size={24} />
            <div>
              <p className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold">AVAILABLE BALANCE</p>
              <p className="text-base font-bold text-white leading-none font-['Chakra_Petch']">
                {profile.currentEssence.toLocaleString()} <span className="text-amber-300 text-xs">SPIDEY COINS</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all font-['Chakra_Petch'] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NEW REWARD</span>
          </button>
        </div>
      </div>

      {/* 2. Subnav Segmented Tabs */}
      <div className="flex items-center gap-2 border-b border-blue-900/20 pb-2">
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'MARKET'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>MARKET CATALOG ({rewards.filter((r) => r.isActive).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'LEDGER'
              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <History className="w-4 h-4" />
          <span>SPIDEY COIN LEDGER ({essenceTransactions.length})</span>
        </button>
      </div>

      {/* TAB 1: REWARDS STORE */}
      {activeTab === 'MARKET' && (
        <div className="space-y-6">
          {/* Motivation Callout & Category Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0E17] p-1.5 rounded-xl border border-blue-900/30 font-mono text-xs">
              {(['ALL', 'FOCUS', 'LEISURE', 'UPGRADE', 'GEAR'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <SpiderIcon size={14} color="#EF4444" />
              <span>Earn Spidey Coins exclusively through completed missions & daily protocols.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map((reward) => {
              const canAfford = profile.currentEssence >= reward.essenceCost;
              const isPulsing = purchasePulseId === reward.id;
              const gear = resolveSpideyGear(reward.icon);

              return (
                <div
                  key={reward.id}
                  className={`
                    p-5 rounded-2xl flex flex-col justify-between transition-all border relative overflow-hidden group
                    ${
                      isPulsing
                        ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.02]'
                        : canAfford
                        ? 'bg-[#0B0F19] border-blue-900/40 shadow-[0_0_15px_rgba(37,99,235,0.06)] hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                        : 'bg-[#080C14] border-slate-800/80 opacity-80'
                    }
                  `}
                >
                  {/* Subtle Web Cyber Accent Glow */}
                  <div
                    className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none blur-3xl opacity-15 transition-opacity group-hover:opacity-30"
                    style={{ backgroundColor: gear.color }}
                  />

                  {/* Purchase feedback pulse overlay */}
                  {isPulsing && (
                    <div className="absolute inset-0 bg-amber-500/15 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-20">
                      <span className="text-xs font-mono font-bold text-amber-300 px-3.5 py-1.5 bg-[#0A0E17] border border-amber-400 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
                        <SpiderIcon size={14} color="#F59E0B" />
                        <span>✓ UPGRADE ACQUIRED // COINS CHARGED</span>
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Top: Spider-Man Tech Badge & Spidey Coin Price */}
                    <div className="flex items-start justify-between mb-3.5">
                      <SpideyMarketBadge iconKey={reward.icon} size="md" />

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070A10] border border-amber-500/40 shadow-sm group-hover:border-amber-400/80 transition-colors">
                        <SpideyCoinIcon size={15} />
                        <span className="text-sm font-bold text-amber-300 font-mono tracking-tight">
                          {reward.essenceCost.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-mono text-amber-400/70 font-bold hidden sm:inline">
                          COINS
                        </span>
                      </div>
                    </div>

                    {/* Tech Classification and Name */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-black/60 border"
                          style={{ color: gear.color, borderColor: `${gear.color}40` }}
                        >
                          {gear.techLabel}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/40 uppercase">
                          {reward.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white font-['Chakra_Petch'] tracking-wide group-hover:text-red-300 transition-colors">
                        {reward.name}
                      </h3>
                    </div>

                    {reward.description && (
                      <p className="text-xs text-slate-400 font-sans mb-4 line-clamp-2 leading-relaxed">
                        {reward.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-blue-900/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(reward, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Reward"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(reward, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handlePurchase(reward)}
                      disabled={!canAfford}
                      className={`
                        px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 font-['Chakra_Petch'] cursor-pointer
                        ${
                          canAfford
                            ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)] active:scale-95'
                            : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }
                      `}
                    >
                      {canAfford ? (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>CLAIM UPGRADE</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>NEED {reward.essenceCost - profile.currentEssence} COINS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION LOG // SPIDEY COIN LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4 font-mono">
          {/* Ledger Filter & Metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0E17] p-4 rounded-2xl border border-blue-900/20">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Available Coins</span>
                <strong className="text-amber-300 font-bold text-sm flex items-center gap-1">
                  <SpideyCoinIcon size={12} /> {profile.currentEssence.toLocaleString()}
                </strong>
              </div>
              <div className="border-l border-blue-900/20 pl-6">
                <span className="text-slate-500 block text-[10px] uppercase">Lifetime Earned</span>
                <strong className="text-blue-400 font-bold text-sm">
                  {profile.totalEssenceEarned.toLocaleString()} COINS
                </strong>
              </div>
              <div className="border-l border-blue-900/20 pl-6">
                <span className="text-slate-500 block text-[10px] uppercase">Total Upgrades Claimed</span>
                <strong className="text-red-400 font-bold text-sm">{purchases.length}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#0F141F] p-1 rounded-xl border border-blue-900/30 text-xs">
              {(['ALL', 'EARNED', 'SPENT'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLedgerFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    ledgerFilter === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0A0E17] border border-blue-900/20 text-center text-xs text-slate-500">
              No transactions logged in the Spidey Coin ledger.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const isEarned = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-[#0A0E17] border border-blue-900/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isEarned
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : 'bg-red-950 text-red-400 border border-red-800/40'
                        }`}
                      >
                        {isEarned ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>

                      <div>
                        <p className="font-bold text-white tracking-wide">{tx.reason}</p>
                        <p className="text-[10px] text-slate-500">
                          {formatReadableDate(tx.timestamp.split('T')[0])} • {formatTimeHUD(tx.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-bold flex items-center gap-1 ${
                          isEarned ? 'text-amber-300' : 'text-red-400'
                        }`}
                      >
                        <SpideyCoinIcon size={12} />
                        {isEarned ? `+${tx.amount}` : tx.amount} COINS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal for Custom Reward */}
      <RewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (editingReward) {
            updateReward(editingReward.id, data);
          } else {
            createReward(data);
          }
        }}
        initialReward={editingReward}
      />

      {/* Confirmation Modal for Reward Deletion */}
      <ConfirmModal
        isOpen={!!deletingReward}
        onClose={() => setDeletingReward(null)}
        onConfirm={handleConfirmDelete}
        title="REMOVE REWARD DIRECTIVE"
        subtitle="MARKET ROSTER OVERRIDE"
        itemName={deletingReward?.name}
        message="Are you sure you want to remove this item from the market roster? It will no longer be available for purchase."
        confirmText="REMOVE REWARD"
        cancelText="ABORT"
        isDestructive={true}
        icon="trash"
      />
    </div>
  );
};

