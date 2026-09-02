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
import { HudCard } from '../ui/HudCard';
import { EssenceDisplay } from '../ui/EssenceDisplay';
import { RewardModal } from '../modals/RewardModal';
import { Reward } from '../../types';
import { formatTimeHUD, formatReadableDate } from '../../utils/date';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'EARNED' | 'SPENT'>('ALL');

  const handleEdit = (reward: Reward, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReward(reward);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this market reward item?')) {
      deleteReward(id);
    }
  };

  const handleOpenCreate = () => {
    setEditingReward(null);
    setIsModalOpen(true);
  };

  const filteredTransactions = essenceTransactions.filter((tx) => {
    if (ledgerFilter === 'EARNED') return tx.amount > 0;
    if (ledgerFilter === 'SPENT') return tx.amount < 0;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#38bdf8] font-bold tracking-widest uppercase">
            <ShoppingBag className="w-4 h-4" />
            <span>OPERATIVE EXCHANGE // CURRENCY REDEMPTION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wide">
            WEB MARKET
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <EssenceDisplay amount={profile.currentEssence} size="lg" />
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white text-xs font-bold tracking-wider uppercase hover:brightness-110 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all font-['Chakra_Petch']"
          >
            <Plus className="w-4 h-4" />
            <span>ADD CUSTOM REWARD</span>
          </button>
        </div>
      </div>

      {/* Subnav Tabs: Market Items vs Essence History Ledger */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('MARKET')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider uppercase transition-all ${
            activeTab === 'MARKET'
              ? 'bg-[#0e1628] text-[#38bdf8] border border-[#38bdf8]/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AVAILABLE REWARDS ({rewards.filter((r) => r.isActive).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider uppercase transition-all ${
            activeTab === 'LEDGER'
              ? 'bg-[#0e1628] text-[#38bdf8] border border-[#38bdf8]/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ESSENCE LEDGER ({essenceTransactions.length})</span>
        </button>
      </div>

      {/* TAB 1: REWARDS STORE */}
      {activeTab === 'MARKET' && (
        <div className="space-y-6">
          {/* Motivation Callout */}
          <div className="p-4 rounded-xl bg-[#09101d] border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>
              Essence is purely in-app virtual fuel earned through honest habit consistency and completed daily missions. Spend it on real-world rest and recharge!
            </span>
            <span className="hidden sm:inline text-slate-500 font-bold">
              ZERO MONETARY VALUE // 100% DISCIPLINE REWARD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canAfford = profile.currentEssence >= reward.essenceCost;
              return (
                <HudCard
                  key={reward.id}
                  variant={canAfford ? 'blue' : 'default'}
                  className="p-5 flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Top: Icon & Price */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl p-2 rounded-xl bg-[#080d1a] border border-slate-800">
                        {reward.icon}
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#080d1a] border border-[#38bdf8]/30">
                        <span className="text-[#38bdf8] font-bold">◈</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {reward.essenceCost.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white font-['Chakra_Petch'] tracking-wide mb-1">
                      {reward.name}
                    </h3>

                    {reward.description && (
                      <p className="text-xs text-slate-400 font-mono mb-4 line-clamp-2">
                        {reward.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(reward, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Reward"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(reward.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff334b] hover:bg-slate-800 transition-colors"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => purchaseReward(reward.id)}
                      disabled={!canAfford}
                      className={`
                        px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5
                        ${
                          canAfford
                            ? 'bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white hover:brightness-110 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                            : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                        }
                      `}
                    >
                      {canAfford ? (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>UNLOCK</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>NEED {reward.essenceCost - profile.currentEssence} ◈</span>
                        </>
                      )}
                    </button>
                  </div>
                </HudCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ESSENCE LEDGER / TRANSACTION HISTORY */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Ledger Filter & Metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d1a] p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">CURRENT BALANCE</span>
                <strong className="text-white font-bold font-mono">◈ {profile.currentEssence.toLocaleString()}</strong>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-500 block text-[10px]">LIFETIME EARNED</span>
                <strong className="text-[#38bdf8] font-bold font-mono">◈ {profile.totalEssenceEarned.toLocaleString()}</strong>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-slate-500 block text-[10px]">TOTAL PURCHASES</span>
                <strong className="text-[#ff334b] font-bold font-mono">{purchases.length}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#0e1628] p-1 rounded-lg border border-slate-700 text-xs">
              {(['ALL', 'EARNED', 'SPENT'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLedgerFilter(tab)}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    ledgerFilter === tab
                      ? 'bg-[#38bdf8] text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <HudCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0b111e] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">DESCRIPTION / OBJECTIVE</th>
                    <th className="py-3 px-4">SOURCE</th>
                    <th className="py-3 px-4">DATE & TIME</th>
                    <th className="py-3 px-4 text-right">DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        NO TRANSACTIONS LOGGED.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            {isPositive ? (
                              <span className="inline-flex items-center gap-1 text-[#22c55e] font-bold">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>INFLOW</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#ff334b] font-bold">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                <span>PURCHASE</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200">
                            {tx.description}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-[#131b2e] text-slate-400 text-[10px]">
                              {tx.source}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {formatReadableDate(tx.date)} • {formatTimeHUD(tx.timestamp)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold text-sm ${
                              isPositive ? 'text-[#38bdf8]' : 'text-[#ff334b]'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} ◈
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </HudCard>
        </div>
      )}

      {/* Custom Reward Modal */}
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
    </div>
  );
};
